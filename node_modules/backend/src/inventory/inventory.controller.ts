import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type JwtReq = Request & { user?: { id: number; role: string; login: string } };

@Controller()
export class InventoryController {
    constructor(private inv: InventoryService) {}

    // LK: посмотреть свой инвентарь
    @UseGuards(JwtAuthGuard)
    @Get('lk/inventory')
    async my(@Req() req: JwtReq) {
        const userId = req.user!.id;
        const items = await this.inv.listByUser(userId);
        return { ok: true, items };
    }

    // Admin: выдать предмет в LK-инвентарь
    @UseGuards(JwtAuthGuard)
    @Post('admin/inventory/grant')
    async grant(@Req() req: JwtReq, @Body() body: { userId: number; item_id: number; amount: number }) {
        if (req.user?.role !== 'admin') return { ok: false, error: 'forbidden' };

        const userId = Number(body.userId);
        const itemId = Number(body.item_id);
        const amount = Number(body.amount || 1);

        if (!Number.isFinite(userId) || userId <= 0) return { ok: false, error: 'bad userId' };
        if (!Number.isFinite(itemId) || itemId <= 0) return { ok: false, error: 'bad item_id' };

        const row = await this.inv.grantToUser(userId, itemId, amount);
        return { ok: true, item: row };
    }
}