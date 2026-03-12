import { Injectable } from "@nestjs/common";
import { pool } from '../db/mysql';
import type { RowDataPacket } from "mysql2";

type CalRow = RowDataPacket & {
    day_date: string; // 'YYYY-MM-DD'
    slot: number;
    item_id: number;
    qty: number;
};

function monthRange(month: string) {
    // month: 'YYYY-MM'
    const start = `${month}-01`;
    const end = `${month}-01`;
    return { start, end }; // end будем считать через DATE_ADD в SQL
}

@Injectable()
export class AdminCalendarService {
    async getMonth(month: string) {
        const { start } = monthRange(month);

        const sql = `
      SELECT day_date, slot, item_id, qty
      FROM admin_calendar_rewards
      WHERE day_date >= ? AND day_date < DATE_ADD(?, INTERVAL 1 MONTH)
      ORDER BY day_date ASC, slot ASC
    `;
        const [rows] = await pool.query<CalRow[]>(sql, [start, start]);

        return rows.map((r) => ({
            day: r.day_date,
            slot: Number(r.slot),
            itemId: Number(r.item_id),
            qty: Number(r.qty),
        }));
    }

    async saveMonth(month: string, items: Array<{ day: string; slot: number; itemId: number; qty: number }>) {
        const { start } = monthRange(month);

        // 1) Upsert всех переданных
        const upsertSql = `
      INSERT INTO admin_calendar_rewards (day_date, slot, item_id, qty)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE item_id = VALUES(item_id), qty = VALUES(qty)
    `;

        // 2) Удалить те, которых больше нет (в этом месяце)
        // Составим список ключей "day|slot" которые должны остаться
        const keepKeys = new Set(items.map((x) => `${x.day}|${x.slot}`));

        // получим текущие записи месяца, сравним и удалим лишние
        const [existing] = await pool.query<CalRow[]>(
            `
      SELECT day_date, slot
      FROM admin_calendar_rewards
      WHERE day_date >= ? AND day_date < DATE_ADD(?, INTERVAL 1 MONTH)
      `,
            [start, start],
        );

        const toDelete = existing
            .map((r) => ({ day: String(r.day_date), slot: Number(r.slot) }))
            .filter((k) => !keepKeys.has(`${k.day}|${k.slot}`));

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            for (const it of items) {
                await conn.query(upsertSql, [it.day, it.slot, it.itemId, it.qty]);
            }

            for (const d of toDelete) {
                await conn.query(`DELETE FROM admin_calendar_rewards WHERE day_date=? AND slot=?`, [d.day, d.slot]);
            }

            await conn.commit();
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }

        return { saved: items.length, deleted: toDelete.length };
    }
}