import { Injectable } from '@nestjs/common';
import { pool } from '../../../db/mysql';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const REWARDS_TABLE = 'marathon_event_rewards';

@Injectable()
export class RewardsService {
    private async getColumns(table: string): Promise<Set<string>> {
        const sql = `
      SELECT COLUMN_NAME AS name
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `;
        const [rows] = await pool.query<RowDataPacket[]>(sql, [table]);
        console.log('[rewards] table=', table, 'cols=', rows.map((r: any) => r.name));
        return new Set(rows.map((r: any) => String(r.name)));
    }

    private pickFirst(cols: Set<string>, variants: string[]): string | null {
        for (const v of variants) if (cols.has(v)) return v;
        return null;
    }

    async createReward(
        eventId: number,
        dto: {
            item_id?: number;
            amount?: number;
            count?: number;
            qty?: number;
            title?: string;
            description?: string;
            probability?: number;
            sort?: number;
            is_enabled?: number;
        },
    ): Promise<number> {
        const cols = await this.getColumns(REWARDS_TABLE);
        if (cols.size === 0) {
            const [t] = await pool.query<RowDataPacket[]>(
                `SELECT TABLE_NAME AS name
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME LIKE '%reward%'`
            );
            throw new Error(`Table ${REWARDS_TABLE} not found in current DB. reward-like tables: ${(t as any[]).map(x => x.name).join(', ')}`);
        }

        // event_id колонка бывает по-разному названа
        const colEventId = this.pickFirst(cols, ['event_id', 'eventId', 'eid', 'marathon_event_id', 'event', 'events_id', 'marathon_events_id', 'mevent_id']);
        if (!colEventId) throw new Error(`No event_id-like column in ${REWARDS_TABLE}. Columns: ${[...cols].join(', ')}`);

        const data: Record<string, any> = {};
        data[colEventId] = eventId;

        // item_id
        const colItemId = this.pickFirst(cols, ['item_id', 'itemId', 'template_id', 'templateId']);
        if (colItemId && dto.item_id !== undefined) data[colItemId] = dto.item_id;

        // amount/count/qty
        const colAmount = this.pickFirst(cols, ['amount', 'count', 'qty', 'quantity', 'num']);
        const amountVal = dto.amount ?? dto.count ?? dto.qty;
        if (colAmount && amountVal !== undefined) data[colAmount] = amountVal;

        if (cols.has('title') && dto.title !== undefined) data.title = dto.title;
        if (cols.has('description') && dto.description !== undefined) data.description = dto.description;

        const colProb = this.pickFirst(cols, ['probability', 'chance', 'weight', 'rate']);
        if (colProb && dto.probability !== undefined) data[colProb] = dto.probability;

        if (cols.has('sort') && dto.sort !== undefined) data.sort = dto.sort;

        // enabled
        if (dto.is_enabled !== undefined) {
            const c = this.pickFirst(cols, ['is_enabled', 'enabled', 'isActive', 'active']);
            if (c) data[c] = dto.is_enabled;
        }

        // защита как у тебя была с events: если в таблице есть обязательные поля без default
        // чаще всего всплывает condition_type
        if (cols.has('condition_type') && data.condition_type === undefined) data.condition_type = 0;

        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(',');
        const sql = `INSERT INTO \`${REWARDS_TABLE}\` (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${placeholders})`;

        const [res] = await pool.query<ResultSetHeader>(sql, keys.map(k => data[k]));
        return Number(res.insertId);
    }
    async listByEvent(eventId: number) {
        const cols = await this.getColumns(REWARDS_TABLE);

        const colEventId = this.pickFirst(cols, [
            'event_id', 'eventId', 'eid',
            'marathon_event_id', 'marathonEventId',
            'marathon_events_id', 'events_id',
            'mevent_id'
        ]);
        if (!colEventId) throw new Error(`No event_id-like column in ${REWARDS_TABLE}`);

        const orderSort = cols.has('sort') ? 'sort ASC, ' : '';
        const sql = `SELECT * FROM \`${REWARDS_TABLE}\` WHERE \`${colEventId}\` = ? ORDER BY ${orderSort} id ASC`;

        const [rows] = await pool.query<RowDataPacket[]>(sql, [eventId]);
        return rows;
    }

    async deleteReward(rewardId: number): Promise<number> {
        const sql = `DELETE FROM \`${REWARDS_TABLE}\` WHERE id = ? LIMIT 1`;
        const [res] = await pool.query<ResultSetHeader>(sql, [rewardId]);
        return Number(res.affectedRows);
    }
}