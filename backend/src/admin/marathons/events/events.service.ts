import { Injectable } from '@nestjs/common';
import { pool } from '../../../db/mysql';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const EVENTS_TABLE = 'marathon_events';

@Injectable()
export class EventsService {
    private async getColumns(table: string): Promise<Set<string>> {
        const sql = `
      SELECT COLUMN_NAME AS name
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `;
        const [rows] = await pool.query<RowDataPacket[]>(sql, [table]);
        return new Set(rows.map((r: any) => String(r.name)));
    }

    private pickFirst(cols: Set<string>, variants: string[]): string | null {
        for (const v of variants) if (cols.has(v)) return v;
        return null;
    }

    async createEvent(

        marathonId: number,
        dto: {
            title: string;
            description?: string;
            start_at: string;
            end_at: string;
            is_enabled?: number;
            sort?: number;
        },

    ): Promise<number> {
        const cols = await this.getColumns(EVENTS_TABLE);

        const colMarathonId = this.pickFirst(cols, ['marathon_id', 'marathonId', 'mid']);
        if (!colMarathonId) throw new Error(`No marathon_id column in ${EVENTS_TABLE}`);

        const data: Record<string, any> = {};
        data[colMarathonId] = marathonId;

        if (cols.has('title')) data.title = dto.title;
        if (cols.has('description')) data.description = dto.description ?? '';
        if (cols.has('start_at')) data.start_at = dto.start_at;
        if (cols.has('end_at')) data.end_at = dto.end_at;
        if (cols.has('condition_type') && data.condition_type === undefined) data.condition_type = 0;

        if (dto.is_enabled !== undefined) {
            const c = this.pickFirst(cols, ['is_enabled', 'enabled', 'isActive', 'active']);
            if (c) data[c] = dto.is_enabled;
        }

        if (dto.sort !== undefined && cols.has('sort')) data.sort = dto.sort;

        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(',');
        const sql = `INSERT INTO \`${EVENTS_TABLE}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${placeholders})`;

        const [res] = await pool.query<ResultSetHeader>(sql, keys.map(k => data[k]));
        return Number(res.insertId);
    }

    async updateEvent(
        eventId: number,
        dto: Partial<{
            title: string;
            description?: string;
            start_at: string;
            end_at: string;
            is_enabled?: number;
            sort?: number;
        }>,
    ): Promise<number> {
        const cols = await this.getColumns(EVENTS_TABLE);

        const sets: string[] = [];
        const values: any[] = [];

        const setIf = (col: string, val: any) => {
            if (!cols.has(col) || val === undefined) return;
            sets.push(`\`${col}\` = ?`);
            values.push(val);
        };

        setIf('title', dto.title);
        setIf('description', dto.description);
        setIf('start_at', dto.start_at);
        setIf('end_at', dto.end_at);
        setIf('sort', dto.sort);

        if (dto.is_enabled !== undefined) {
            const c = this.pickFirst(cols, ['is_enabled', 'enabled', 'isActive', 'active']);
            if (c) {
                sets.push(`\`${c}\` = ?`);
                values.push(dto.is_enabled);
            }
        }

        if (sets.length === 0) return 0;

        const sql = `UPDATE \`${EVENTS_TABLE}\` SET ${sets.join(', ')} WHERE id = ? LIMIT 1`;
        values.push(eventId);

        const [res] = await pool.query<ResultSetHeader>(sql, values);
        return Number(res.affectedRows);
    }
    async listByMarathon(marathonId: number) {
        const cols = await this.getColumns(EVENTS_TABLE);

        const colMarathonId = this.pickFirst(cols, ['marathon_id', 'marathonId', 'mid']);
        if (!colMarathonId) throw new Error(`No marathon_id column in ${EVENTS_TABLE}`);

        const orderSort = cols.has('sort') ? 'sort ASC, ' : '';
        const sql = `SELECT * FROM \`${EVENTS_TABLE}\` WHERE \`${colMarathonId}\` = ? ORDER BY ${orderSort} id ASC`;

        const [rows] = await pool.query<RowDataPacket[]>(sql, [marathonId]);
        return rows;
    }

    async deleteEvent(eventId: number): Promise<number> {
        const sql = `DELETE FROM \`${EVENTS_TABLE}\` WHERE id = ? LIMIT 1`;
        const [res] = await pool.query<ResultSetHeader>(sql, [eventId]);
        return Number(res.affectedRows);
    }
}