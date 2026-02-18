import { Injectable } from '@nestjs/common';
import { pool } from '../db/mysql';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';


@Injectable()
export class InventoryService {
    async listByUser(userId: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT id, user_id, item_id, amount, created_at
       FROM lk_inventory
       WHERE user_id = ?
       ORDER BY id DESC`,
            [userId],
        );
        return rows;
    }

    async grantToUser(userId: number, itemId: number, amount: number) {
        const amt = Math.max(1, Number(amount || 1));
        const [r] = await pool.query<ResultSetHeader>(
            `INSERT INTO lk_inventory (user_id, item_id, amount) VALUES (?, ?, ?)`,
            [userId, itemId, amt],
        );
        return { id: r.insertId, user_id: userId, item_id: itemId, amount: amt };
    }
}