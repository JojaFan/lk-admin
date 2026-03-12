import { Body, Controller, Get, Post, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import type { RegisterResult } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtUser } from './types';

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService, private jwt: JwtService) {}

    @Post('login')
    async login(
        @Body() body: { login: string; password: string },
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const user = await this.auth.validateUser(body.login, body.password);
        const token = this.auth.signAccessToken(user);

        res.cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 30 * 60 * 1000,
            path: '/',
        });

        // ✅ логируем вход (IP + time) в login_log
        const ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.ip ||
            '';
        await this.auth.logLogin(user, ip);

        return { ok: true, user };
    }

    @Post('register')
    async register(@Body() body: any, @Res({ passthrough: true }) res: Response) {
        const login = String(body?.login ?? '').trim();
        const password = String(body?.password ?? '');
        const email = body?.email ? String(body.email).trim() : undefined;
        const ref = body?.ref ? String(body.ref).trim() : undefined;

        if (!login || !password) {
            throw new BadRequestException('login and password required');
        }

        const r: RegisterResult = await this.auth.registerUser(login, password, email, ref);
        if (!r.ok) return r;

        // если у тебя register делает авто-логин и ставит cookie — оставь твой код как был
        // res.cookie(...)

        return r;
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(
        @Req() req: Request & { user?: JwtUser },
        @Body() body: { currentPassword: string; newPassword: string },
    ) {
        const currentPassword = String(body?.currentPassword || '');
        const newPassword = String(body?.newPassword || '');

        if (!currentPassword || !newPassword) {
            throw new BadRequestException('currentPassword and newPassword required');
        }

        const userId = Number((req.user as any)?.id ?? (req.user as any)?.sub);
        const login = String((req.user as any)?.login ?? '');
        const role = String((req.user as any)?.role ?? 'user');

        return this.auth.changePassword(userId, login, role as any, currentPassword, newPassword);
    }

    @Get('me')
    me(@Req() req: Request) {
        const token = (req as any).cookies?.access_token;
        if (!token) return { ok: false, error: 'no_cookie' };

        try {
            const payload: any = this.jwt.verify(token);
            return { ok: true, user: { id: payload.sub, login: payload.login, role: payload.role } };
        } catch (e: any) {
            return { ok: false, error: 'bad_token', message: e?.message };
        }
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', {
            path: '/',
            sameSite: 'lax',
            secure: false,
        });
        return { ok: true };
    }

}
