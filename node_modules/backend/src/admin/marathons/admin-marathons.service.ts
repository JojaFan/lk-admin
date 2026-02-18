import {Injectable, NotFoundException} from '@nestjs/common';
import {pool} from '../../db/mysql';
import type {RowDataPacket, ResultSetHeader} from 'mysql2';

type MarathonRow = RowDataPacket & {
    id: number;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    is_enabled: number;
};

@Injectable()
export class AdminMarathonsService {
    async list() {
        const [rows] = await pool.query<MarathonRow[]>(
            `SELECT id, title, description, start_at, end_at, is_enabled
             FROM marathons
             ORDER BY id DESC`,
        );
        return {ok: true, marathons: rows};
    }

    async create(data: {
        title: string;
        description?: string | null;
        start_at: string;
        end_at: string;
        is_enabled?: number;
    }) {
        const title = String(data.title ?? '').trim();
        if (!title) return {ok: false, message: 'title is required'};

        const description = data.description ?? null;
        const start_at = data.start_at;
        const end_at = data.end_at;
        const is_enabled = typeof data.is_enabled === 'number' ? data.is_enabled : 1;

        const [res] = await pool.query<ResultSetHeader>(
            `INSERT INTO marathons (title, description, start_at, end_at, is_enabled)
             VALUES (?, ?, ?, ?, ?)`,
            [title, description, start_at, end_at, is_enabled],
        );

        return {ok: true, id: res.insertId};
    }

    async update(id: number, data: Partial<{
        title: string;
        description: string | null;
        start_at: string;
        end_at: string;
        is_enabled: number;
    }>) {
        if (!Number.isFinite(id)) throw new NotFoundException('Invalid id');

        // соберём SET динамически
        const sets: string[] = [];
        const params: any[] = [];

        if (data.title !== undefined) {
            sets.push('title = ?');
            params.push(String(data.title).trim());
        }
        if (data.description !== undefined) {
            sets.push('description = ?');
            params.push(data.description);
        }
        if (data.start_at !== undefined) {
            sets.push('start_at = ?');
            params.push(data.start_at);
        }
        if (data.end_at !== undefined) {
            sets.push('end_at = ?');
            params.push(data.end_at);
        }
        if (data.is_enabled !== undefined) {
            sets.push('is_enabled = ?');
            params.push(data.is_enabled);
        }

        if (!sets.length) return {ok: false, message: 'Nothing to update'};

        params.push(id);

        const [res] = await pool.query<ResultSetHeader>(
            `UPDATE marathons
             SET ${sets.join(', ')}
             WHERE id = ? LIMIT 1`,
            params,
        );

        if (res.affectedRows === 0) throw new NotFoundException('Marathon not found');
        return {ok: true};
    }

    async remove(id: number) {
        const [res] = await pool.query<ResultSetHeader>(
            `DELETE
             FROM marathons
             WHERE id = ? LIMIT 1`,
            [id],
        );
        if (res.affectedRows === 0) throw new NotFoundException('Marathon not found');
        return {ok: true};
    }
}