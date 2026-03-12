import { Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';
import type { RowDataPacket } from 'mysql2';

@Injectable()
export class LkService {
    private async getColumns(table: string): Promise<Set<string>> {
        const sql = `
            SELECT COLUMN_NAME AS name
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
        `;
        const [rows] = await pool.query<RowDataPacket[]>(sql, [table]);
        return new Set(rows.map((r) => String((r as any).name)));
    }

    private pickFirst(cols: Set<string>, variants: string[]): string | null {
        for (const v of variants) if (cols.has(v)) return v;
        return null;
    }

    async getTopCharacters(limit = 100) {
        const sql = `
            SELECT rolename AS name, rolelevel AS level, pkvalue, reborn, factionid
            FROM top
            ORDER BY rolelevel DESC, pkvalue DESC
                LIMIT ?
        `;
        const [rows] = await pool.query<RowDataPacket[]>(sql, [limit]);
        return { ok: true, characters: rows };
    }

    async getTopGuilds(limit = 100) {
        const sql = `
            SELECT name, level, members, mastername
            FROM klan
            ORDER BY level DESC, members DESC
                LIMIT ?
        `;
        const [rows] = await pool.query<RowDataPacket[]>(sql, [limit]);
        return { ok: true, guilds: rows };
    }

    async getRatings(limit = 100) {
        const [chars, guilds] = await Promise.all([
            this.getTopCharacters(limit),
            this.getTopGuilds(limit),
        ]);

        return {
            ok: true,
            characters: chars.characters ?? [],
            guilds: guilds.guilds ?? [],
        };
    }

    async getInventory(userId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT item_id, item_count
             FROM lk_items
             WHERE user_id = ?
             ORDER BY item_id ASC`,
            [userId],
        );
        return { ok: true, items: rows };
    }

    async getPromocodes(userId: number, limit = 50) {
        const cols = await this.getColumns('promo_codes');

        const codeCol = this.pickFirst(cols, ['code', 'promocode', 'name']);
        const usedCol = this.pickFirst(cols, ['used', 'is_used', 'activated']);
        const usedByCol = this.pickFirst(cols, ['used_by', 'userid', 'user_id', 'used_userid']);
        const activeCol = this.pickFirst(cols, ['active', 'enabled', 'is_active']);
        const idCol = this.pickFirst(cols, ['id', 'promo_id', 'pid']);
        const orderBy = idCol ? `ORDER BY ${idCol} DESC` : `ORDER BY ${codeCol} DESC`;

        if (!codeCol) return { ok: true, active: [], used: [] };

        const activeWhere = activeCol ? `AND ${activeCol} = 1` : '';

        let usedWhere = '';
        const usedParams: any[] = [];
        if (usedByCol) {
            usedWhere = `AND ${usedByCol} = ?`;
            usedParams.push(userId);
        } else if (usedCol) {
            usedWhere = `AND ${usedCol} = 1`;
        } else {
            usedWhere = `AND 1=0`;
        }

        let activeNotUsed = '';
        const activeParams: any[] = [];
        if (usedByCol) {
            activeNotUsed = `AND (${usedByCol} IS NULL OR ${usedByCol} = 0)`;
        } else if (usedCol) {
            activeNotUsed = `AND ${usedCol} = 0`;
        }

        const sqlActive = `
      SELECT ${codeCol} AS code
      FROM promo_codes
      WHERE 1=1
        ${activeWhere} ${activeNotUsed}
      ${orderBy}
      LIMIT ?
    `;

        const sqlUsed = `
      SELECT ${codeCol} AS code
      FROM promo_codes
      WHERE 1=1
        ${activeWhere} ${usedWhere}
      ${orderBy}
      LIMIT ?
    `;

        const [activeRows] = await pool.query<RowDataPacket[]>(sqlActive, [...activeParams, limit]);
        const [usedRows] = await pool.query<RowDataPacket[]>(sqlUsed, [...usedParams, limit]);

        return {
            ok: true,
            active: activeRows.map((r) => String((r as any).code)),
            used: usedRows.map((r) => String((r as any).code)),
        };
    }

    async applyPromocode(userId: number, code?: string) {
        const normalized = String(code || '').trim().toUpperCase();
        if (!normalized) return { ok: false, message: 'Введите промокод' };

        const cols = await this.getColumns('promo_codes');
        const codeCol = this.pickFirst(cols, ['code', 'promocode', 'name']);
        const usedCol = this.pickFirst(cols, ['used', 'is_used', 'activated']);
        const usedByCol = this.pickFirst(cols, ['used_by', 'userid', 'user_id', 'used_userid']);
        const activeCol = this.pickFirst(cols, ['active', 'enabled', 'is_active']);

        if (!codeCol) return { ok: false, message: 'Таблица promo_codes не содержит колонку кода' };

        const activeWhere = activeCol ? `AND ${activeCol} = 1` : '';
        const findSql = `
      SELECT *
      FROM promo_codes
      WHERE UPPER(${codeCol}) = ?
        ${activeWhere}
      LIMIT 1
    `;

        const [rows] = await pool.query<RowDataPacket[]>(findSql, [normalized]);
        const row: any = (rows as any[])?.[0];
        if (!row) return { ok: false, message: 'Промокод не найден' };

        if (usedByCol && row[usedByCol]) return { ok: false, message: 'Промокод уже использован' };
        if (usedCol && Number(row[usedCol]) === 1) return { ok: false, message: 'Промокод уже использован' };

        if (usedByCol || usedCol) {
            const sets: string[] = [];
            const params: any[] = [];

            if (usedByCol) {
                sets.push(`${usedByCol} = ?`);
                params.push(userId);
            }
            if (usedCol) sets.push(`${usedCol} = 1`);

            const updSql = `
        UPDATE promo_codes
        SET ${sets.join(', ')}
        WHERE UPPER(${codeCol}) = ?
        LIMIT 1
      `;
            params.push(normalized);

            await pool.query(updSql, params);
            return { ok: true, message: `Промокод ${normalized} применён` };
        }

        return {
            ok: true,
            message: `Промокод ${normalized} найден (но в БД нет полей used/used_by для отметки)`,
        };
    }

    // ✅ История входов ЛК: читаем из login_log (она есть в дампе и подходит идеально)
    async getLoginHistory(userId: number, limit = 20) {
        // на всякий случай проверим, что таблица есть
        const cols = await this.getColumns('login_log').catch(() => null);
        if (!cols) return { ok: true, items: [] };

        // в твоём дампе: data, ip, userid, login, action
        const userCol = this.pickFirst(cols, ['userid', 'user_id', 'id_user']);
        const ipCol = this.pickFirst(cols, ['ip', 'loginip', 'userip']);
        const timeCol = this.pickFirst(cols, ['data', 'add_date', 'date', 'time', 'created_at']);
        const actionCol = this.pickFirst(cols, ['action', 'status', 'result', 'success']);

        if (!userCol || !ipCol) return { ok: true, items: [] };

        const timeExpr = timeCol ? `${timeCol} AS at` : `NOW() AS at`;
        const statusExpr = actionCol ? `${actionCol} AS status` : `'login' AS status`;

        const sql = `
      SELECT
        ${ipCol} AS ip,
        ${timeExpr},
        ${statusExpr}
      FROM login_log
      WHERE ${userCol} = ?
      ORDER BY ${timeCol ?? ipCol} DESC
      LIMIT ?
    `;

        const [rows] = await pool.query<RowDataPacket[]>(sql, [userId, limit]);
        return { ok: true, items: rows };
    }

    async getChars(userId: number, limit = 50) {
        // ✅ 0) Сначала пробуем "визуальные" персонажи из lk_characters (для ЛК/UI)
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `
    SELECT id, name, class, race, level, equipment_json
    FROM lk_characters
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT ?
    `,
                [userId, limit],
            );

            const list = (rows as any[]).map((r) => ({
                id: Number(r.id),
                name: String(r.name),
                level: r.level != null ? Number(r.level) : 1,
                class: r.class ? String(r.class) : null,
                race: r.race ? String(r.race) : null,
                equipment: r.equipment_json ? r.equipment_json : {},
            }));

            // если нашли хотя бы одного — возвращаем и НЕ идём в base/top
            if (list.length) return { ok: true, characters: list };
        } catch {
            // если таблицы ещё нет — просто идём дальше на base/top
        }
        const baseCols = await this.getColumns('base').catch(() => null);

        if (baseCols) {
            const idCol = this.pickFirst(baseCols, ['id', 'roleid']);
            const nameCol = this.pickFirst(baseCols, ['name', 'rolename']);
            const levelCol = this.pickFirst(baseCols, ['level', 'rolelevel']);
            const classCol = this.pickFirst(baseCols, ['occupation', 'class', 'roleprof']);
            const genderCol = this.pickFirst(baseCols, ['gender', 'rolegender']);
            const ownerCol = this.pickFirst(baseCols, ['akkid', 'userid', 'user_id']);

            if (idCol && nameCol && ownerCol) {
                const fields = [
                    `${idCol} AS id`,
                    `${nameCol} AS name`,
                    levelCol ? `${levelCol} AS level` : `0 AS level`,
                    classCol ? `${classCol} AS classId` : `NULL AS classId`,
                    genderCol ? `${genderCol} AS gender` : `NULL AS gender`,
                ].join(', ');

                const sql = `
          SELECT ${fields}
          FROM base
          WHERE ${ownerCol} = ?
          ORDER BY ${levelCol ?? idCol} DESC
          LIMIT ?
        `;

                const [rows] = await pool.query<RowDataPacket[]>(sql, [userId, limit]);
                return { ok: true, characters: rows };
            }
        }

        const topCols = await this.getColumns('top').catch(() => null);
        if (!topCols) return { ok: true, characters: [] };

        const userCol = this.pickFirst(topCols, ['userid', 'user_id']);
        const roleIdCol = this.pickFirst(topCols, ['roleid', 'id']);
        const roleNameCol = this.pickFirst(topCols, ['rolename', 'name']);
        const roleLevelCol = this.pickFirst(topCols, ['rolelevel', 'level']);
        const roleProfCol = this.pickFirst(topCols, ['roleprof', 'occupation']);
        const roleGenderCol = this.pickFirst(topCols, ['rolegender', 'gender']);

        if (!userCol || !roleIdCol || !roleNameCol) return { ok: true, characters: [] };

        const fields = [
            `${roleIdCol} AS id`,
            `${roleNameCol} AS name`,
            roleLevelCol ? `${roleLevelCol} AS level` : `0 AS level`,
            roleProfCol ? `${roleProfCol} AS classId` : `NULL AS classId`,
            roleGenderCol ? `${roleGenderCol} AS gender` : `NULL AS gender`,
        ].join(', ');

        const sql = `
      SELECT ${fields}
      FROM top
      WHERE ${userCol} = ?
      ORDER BY ${roleLevelCol ?? roleIdCol} DESC
      LIMIT ?
    `;

        const [rows] = await pool.query<RowDataPacket[]>(sql, [userId, limit]);
        return { ok: true, characters: rows };
    }

    async getShop(userId: number, opts?: { subcatId?: number; limit?: number }) {
        const limit = opts?.limit ?? 100;

        const [catsRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, name FROM shop_cat ORDER BY id ASC`,
        );

        const [subcatsRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, catid, name FROM shop_subcat ORDER BY catid ASC, id ASC`,
        );

        const firstSubcatId = subcatsRows?.length ? Number((subcatsRows[0] as any).id) : null;
        const selectedSubcatId = opts?.subcatId != null ? Number(opts.subcatId) : firstSubcatId;

        if (!selectedSubcatId) {
            return { ok: true, cats: catsRows, subcats: subcatsRows, selectedSubcatId: null, items: [] };
        }

        const [itemsRows] = await pool.query<RowDataPacket[]>(
            `
        SELECT
          id, itemid, count, maxcount, subcat,
          cost_timeless, cost_expire, expire,
          \`desc\` AS description,
          rest, buycount
        FROM shop_items
        WHERE subcat = ?
        ORDER BY id DESC
        LIMIT ?
      `,
            [selectedSubcatId, limit],
        );

        return {
            ok: true,
            cats: catsRows,
            subcats: subcatsRows,
            selectedSubcatId,
            items: itemsRows,
        };
    }

    async getHome(userId: number, login: string, currentIp: string) {
        // ✅ аккаунт из lk_users
        let u: any = null;

        if (userId && !Number.isNaN(userId)) {
            const [uRows] = await pool.query<RowDataPacket[]>(
                `SELECT id, login AS username, email, role, status, referral_code
         FROM lk_users
         WHERE id = ?
         LIMIT 1`,
                [userId],
            );
            u = (uRows as any[])?.[0] ?? null;
        }

        if (!u && login) {
            const [uRows2] = await pool.query<RowDataPacket[]>(
                `SELECT id, login AS username, email, role, status, referral_code
         FROM lk_users
         WHERE login = ?
         LIMIT 1`,
                [login],
            );
            u = (uRows2 as any[])?.[0] ?? null;
        }

        if (!u) return { ok: false, error: 'account_not_found' };

        const promocodes = await this.getPromocodes(userId).catch(() => ({
            ok: true,
            active: [],
            used: [],
        }));

        const history = await this.getLoginHistory(userId).catch(() => ({
            ok: true,
            items: [],
        }));

        const lastLoginIp = (history.items as any[])?.[0]?.ip ?? '';

        return {
            ok: true,
            account: {
                id: u.id,
                email: u.email ?? '',
                username: u.username ?? '',
                ip: currentIp ?? '',
                lastLoginIp,
                referralCode: u.referral_code ?? `U${u.id}`,
            },
            promocodes: {
                active: promocodes.active ?? [],
                used: promocodes.used ?? [],
            },
            loginHistory: history.items ?? [],
            vote: { title: 'Голосование за сервер', url: '#' },
        };
    }
    async getReferrals(userId: number) {
        // Кто пригласил меня?
        const [invitedByRows] = await pool.query<RowDataPacket[]>(
            `
    SELECT u.id, u.login, r.created_at
    FROM referrals r
    JOIN lk_users u ON u.id = r.referrer_userid
    WHERE r.referred_userid = ?
    LIMIT 1
    `,
            [userId],
        );

        // Кого пригласил я?
        const [invitedRows] = await pool.query<RowDataPacket[]>(
            `
    SELECT u.id, u.login, u.created_at
    FROM referrals r
    JOIN lk_users u ON u.id = r.referred_userid
    WHERE r.referrer_userid = ?
    ORDER BY r.created_at DESC
    `,
            [userId],
        );

        const invitedBy = (invitedByRows as any[])?.[0]
            ? {
                id: Number((invitedByRows as any[])[0].id),
                login: String((invitedByRows as any[])[0].login),
                joinedAt: (invitedByRows as any[])[0].created_at,
            }
            : null;

        const invited = (invitedRows as any[]).map((x) => ({
            id: Number((x as any).id),
            login: String((x as any).login),
            createdAt: (x as any).created_at,
        }));

        return { ok: true, invitedBy, total: invited.length, invited };
    }
    async getShopProducts(limit = 200) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `
    SELECT
      p.id,
      p.item_id AS itemId,
      i.name AS name,
      p.stack_count AS stackCount,
      p.price
    FROM lk_shop_products p
    LEFT JOIN item_items i ON i.item_id = p.item_id
    WHERE p.is_enabled = 1
    ORDER BY p.sort_order ASC, p.id DESC
    LIMIT ?
    `,
            [limit],
        );

        return { ok: true, items: rows };
    }

    async buyShopProduct(userId: number, body: { productId: number; charId: number; qty?: number }) {
        const productId = Number(body.productId);
        const charId = Number(body.charId);
        const qty = Math.max(1, Number(body.qty || 1));

        if (!productId || !charId) return { ok: false, error: 'Missing productId/charId' };

        // ✅ берём персонажей этого аккаунта
        const charsRes = await this.getChars(userId, 999);
        const chars = (charsRes as any)?.characters || [];

        const owns = chars.some((c: any) => Number(c.id) === charId);
        if (!owns) return { ok: false, error: 'Character does not belong to this account' };

        // дальше: товар -> mail
        return { ok: true };
    }

}
