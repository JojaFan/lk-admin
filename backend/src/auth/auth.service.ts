import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';


import { pool } from '../db/mysql';
import type { JwtPayload, Role } from './types';

export type RegisterResult =
    | { ok: false; error: 'login_taken' | 'login_reserved' }
    | { ok: true; user: JwtPayload };

function toRole(x: any): Role {
    return x === 'admin' || x === 'support' || x === 'user' ? x : 'user';
}

@Injectable()
export class AuthService {
    constructor(private jwt: JwtService) {}

    // Логин: сначала проверяем admin_panel, потом lk_users
    async validateUser(login: string, password: string): Promise<JwtPayload> {
        // 1) Админ из admin_panel
        const [aRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, username, password
             FROM admin_panel
             WHERE username = ?
                 LIMIT 1`,
            [login],
        );

        if (aRows.length) {
            const a = aRows[0] as any;
            const ok = await bcrypt.compare(password, String(a.password));
            if (!ok) throw new UnauthorizedException('invalid_credentials');

            return {
                id: Number(a.id),
                login: String(a.username),
                role: 'admin',
            };
        }

        // 2) Обычный пользователь из lk_users
        const [uRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, login, password_hash, role, status
             FROM lk_users
             WHERE login = ?
                 LIMIT 1`,
            [login],
        );

        if (!uRows.length) throw new UnauthorizedException('invalid_credentials');

        const u = uRows[0] as any;
        if (String(u.status) !== 'active') throw new UnauthorizedException('user_inactive');

        const passOk = await bcrypt.compare(password, String(u.password_hash));
        if (!passOk) throw new UnauthorizedException('invalid_credentials');

        return {
            id: Number(u.id),
            login: String(u.login),
            role: toRole(u.role),
        };
    }

    // Регистрация (создаёт юзера в lk_users)
    async registerUser(login: string, password: string, email?: string, ref?: string): Promise<RegisterResult> {

        const [exists] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM lk_users WHERE login = ? LIMIT 1`,
            [login],
        );

        if (exists.length) return { ok: false, error: 'login_taken' };

        const [aExists] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM admin_panel WHERE username = ? LIMIT 1`,
            [login],
        );
        if (aExists.length) return { ok: false, error: 'login_reserved' };


        const password_hash = await bcrypt.hash(password, 10);
        const referralCode = await this.generateReferralCode();

        const [ins] = await pool.query<ResultSetHeader>(
            `INSERT INTO lk_users (login, password_hash, role, status, email, referral_code)
             VALUES (?, ?, 'user', 'active', ?, ?)`,
            [login, password_hash, email ?? null, referralCode],
        );


        const id = Number(ins.insertId);
        // Если регистрация была по реф-ссылке, создаём связь (referral_code -> referrer_userid)
        const normalizedRef = (ref ?? '').trim();
        if (normalizedRef) {
            const [refRows] = await pool.query<RowDataPacket[]>(
                `SELECT id FROM lk_users WHERE referral_code = ? LIMIT 1`,
                [normalizedRef],
            );

            const referrerId = Number((refRows as any[])?.[0]?.id ?? 0);
            if (referrerId && referrerId !== id) {
                // Один юзер может быть рефералом только 1 раз -> UNIQUE(referred_userid)
                await pool.query(
                    `INSERT IGNORE INTO referrals (referrer_userid, referred_userid) VALUES (?, ?)`,
                    [referrerId, id],
                );
            }
        }



        return {
            ok: true,
            user: { id, login, role: 'user' },
        };
    }
    private async generateReferralCode(): Promise<string> {
        // 12 символов A-Z0-9
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        for (let attempt = 0; attempt < 10; attempt++) {
            const buf = randomBytes(12);
            let code = '';
            for (let i = 0; i < 12; i++) code += alphabet[buf[i] % alphabet.length];

            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT id FROM lk_users WHERE referral_code = ? LIMIT 1`,
                [code],
            );

            if (!(rows as any[]).length) return code;
        }

        // fallback (крайний случай)
        return 'REF' + String(Date.now());
    }

    signAccessToken(user: JwtPayload): string {
        return this.jwt.sign({
            sub: user.id,
            login: user.login,
            role: user.role,
        });
    }


    // ✅ лог логина в login_log
    async logLogin(user: JwtPayload, ip: string) {
        try {
            // в дампе login_log.id НЕ auto_increment -> делаем MAX+1
            const [mx] = await pool.query<RowDataPacket[]>(`SELECT IFNULL(MAX(id),0)+1 AS id FROM login_log`);
            const nextId = Number((mx as any[])?.[0]?.id ?? 1);

            // action: пусть будет 1 (успешный логин)
            await pool.query(
                `INSERT INTO login_log (id, data, ip, userid, login, action)
         VALUES (?, NOW(), ?, ?, ?, ?)`,
                [nextId, ip ?? '', user.id, user.login, 1],
            );
        } catch {
            // лог — не критично
        }
    }

    // ✅ смена пароля (lk_users или admin_panel)
    async changePassword(
        userId: number,
        login: string,
        role: Role,
        currentPassword: string,
        newPassword: string,
    ) {
        if (!newPassword || newPassword.length < 6) {
            return { ok: false, error: 'password_too_short' };
        }

        if (role === 'admin') {
            // admin_panel
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT id, password
         FROM admin_panel
         WHERE id = ? AND username = ?
         LIMIT 1`,
                [userId, login],
            );

            const a: any = (rows as any[])?.[0];
            if (!a) return { ok: false, error: 'account_not_found' };

            const ok = await bcrypt.compare(currentPassword, String(a.password));
            if (!ok) return { ok: false, error: 'wrong_password' };

            const newHash = await bcrypt.hash(newPassword, 10);

            await pool.query(
                `UPDATE admin_panel SET password = ? WHERE id = ?`,
                [newHash, userId],
            );

            return { ok: true };
        }

        // lk_users
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, password_hash
       FROM lk_users
       WHERE id = ? AND login = ?
       LIMIT 1`,
            [userId, login],
        );

        const u: any = (rows as any[])?.[0];
        if (!u) return { ok: false, error: 'account_not_found' };

        const ok = await bcrypt.compare(currentPassword, String(u.password_hash));
        if (!ok) return { ok: false, error: 'wrong_password' };

        const newHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE lk_users SET password_hash = ? WHERE id = ?`,
            [newHash, userId],
        );

        return { ok: true };
    }
}
