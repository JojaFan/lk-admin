import { Injectable } from "@nestjs/common";
import { pool } from "../../db/mysql";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export type ShopProductRow = {
    id: number;
    itemId: number;
    itemName: string | null;
    stackCount: number;
    price: number;
    isEnabled: number;
    sortOrder: number;
};

@Injectable()
export class AdminShopService {
    async list(): Promise<ShopProductRow[]> {
        const sql = `
      SELECT
        p.id,
        p.item_id AS itemId,
        i.name AS itemName,
        p.stack_count AS stackCount,
        p.price,
        p.is_enabled AS isEnabled,
        p.sort_order AS sortOrder
      FROM lk_shop_products p
      LEFT JOIN item_items i ON i.item_id = p.item_id
      ORDER BY p.sort_order ASC, p.id DESC
    `;
        const [rows] = await pool.query<RowDataPacket[]>(sql);
        return rows as any;
    }

    async create(input: { itemId: number; stackCount: number; price: number; isEnabled?: boolean; sortOrder?: number }) {
        const sql = `
      INSERT INTO lk_shop_products (item_id, stack_count, price, is_enabled, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [r] = await pool.execute<ResultSetHeader>(sql, [
            input.itemId,
            input.stackCount,
            input.price,
            input.isEnabled === false ? 0 : 1,
            input.sortOrder ?? 0,
        ]);
        return { id: r.insertId };
    }

    async update(id: number, input: Partial<{ itemId: number; stackCount: number; price: number; isEnabled: boolean; sortOrder: number }>) {
        // соберём UPDATE только из переданных полей
        const sets: string[] = [];
        const vals: any[] = [];

        if (input.itemId !== undefined) { sets.push("item_id = ?"); vals.push(input.itemId); }
        if (input.stackCount !== undefined) { sets.push("stack_count = ?"); vals.push(input.stackCount); }
        if (input.price !== undefined) { sets.push("price = ?"); vals.push(input.price); }
        if (input.isEnabled !== undefined) { sets.push("is_enabled = ?"); vals.push(input.isEnabled ? 1 : 0); }
        if (input.sortOrder !== undefined) { sets.push("sort_order = ?"); vals.push(input.sortOrder); }

        if (sets.length === 0) return { ok: true }; // ничего менять

        const sql = `UPDATE lk_shop_products SET ${sets.join(", ")} WHERE id = ?`;
        vals.push(id);

        await pool.execute(sql, vals);
        return { ok: true };
    }

    async remove(id: number) {
        await pool.execute("DELETE FROM lk_shop_products WHERE id = ?", [id]);
        return { ok: true };
    }
}