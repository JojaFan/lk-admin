import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { LkService } from './lk.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtUser } from '../auth/types';

@Controller('lk')
@UseGuards(JwtAuthGuard)
export class LkController {
    constructor(private readonly lk: LkService) {}

    private getUserId(req: Request & { user?: JwtUser }) {
        return Number((req.user as any)?.id ?? (req.user as any)?.sub);
    }

    private getLogin(req: Request & { user?: JwtUser }) {
        return String((req.user as any)?.login ?? '');
    }

    private getIp(req: Request) {
        return (
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.ip ||
            ''
        );
    }

    @Get('home')
    getHome(@Req() req: Request & { user?: JwtUser }) {
        const userId = this.getUserId(req);
        const login = this.getLogin(req);
        const ip = this.getIp(req);
        return this.lk.getHome(userId, login, ip);
    }

    @Get('inventory')
    getInventory(@Req() req: Request & { user?: JwtUser }) {
        return this.lk.getInventory(this.getUserId(req));
    }

    @Get('chars')
    getChars(@Req() req: Request & { user?: JwtUser }, @Query('limit') limit?: string) {
        return this.lk.getChars(this.getUserId(req), Number(limit) || 50);
    }

    @Get('shop')
    getShop(
        @Req() req: Request & { user?: JwtUser },
        @Query('subcatId') subcatId?: string,
        @Query('limit') limit?: string,
    ) {
        return this.lk.getShop(this.getUserId(req), {
            subcatId: subcatId ? Number(subcatId) : undefined,
            limit: Number(limit) || 100,
        });
    }

    @Get('promocodes')
    getPromocodes(@Req() req: Request & { user?: JwtUser }) {
        return this.lk.getPromocodes(this.getUserId(req));
    }

    @Post('promocodes/apply')
    applyPromocode(@Req() req: Request & { user?: JwtUser }, @Body() body: any) {
        return this.lk.applyPromocode(this.getUserId(req), body?.code);
    }

    // --- RATINGS ---
    // эти можно оставить под JWT (как сейчас), либо сделать публичными — как решишь
    @Get('ratings/characters')
    getTopCharacters(@Query('limit') limit?: string) {
        return this.lk.getTopCharacters(Number(limit) || 100);
    }

    @Get('ratings/guilds')
    getTopGuilds(@Query('limit') limit?: string) {
        return this.lk.getTopGuilds(Number(limit) || 100);
    }

    @Get('ratings')
    getRatings(@Query('limit') limit?: string) {
        return this.lk.getRatings(Number(limit) || 100);
    }

    // заглушки оставил как были
    @Get('coins')
    getCoins() {
        return {
            ok: true,
            balance: 1200,
            note: 'Заглушка: перенос доната/монет будет позже',
        };
    }

    @Get('donate')
    getDonate() {
        return {
            ok: true,
            currency: 'coins',
            packages: [
                { id: 'p1', title: 'Старт', coins: 100, priceText: '₪10' },
                { id: 'p2', title: 'Мид', coins: 550, priceText: '₪49' },
                { id: 'p3', title: 'Премиум', coins: 1200, priceText: '₪99' },
            ],
            note: 'Пока без платежей: кнопки на фронте будут заглушкой',
        };
    }

    @Get('referrals')
    getReferrals() {
        return {
            ok: true,
            invitedBy: { nick: 'OldPlayer', joinedAt: '2026-02-01' },
            invited: [
                { id: 1, nick: 'NewbieOne', online: true, onlineChar: 'Mage_01' },
                { id: 2, nick: 'NewbieTwo', online: false, onlineChar: null },
                { id: 3, nick: 'NewbieThree', online: true, onlineChar: 'Warrior_X' },
            ],
            rewards: {
                available: [
                    { id: 'r1', title: 'Пригласить 1 игрока', status: 'done', reward: '50 coins' },
                    { id: 'r2', title: 'Пригласить 3 игроков', status: 'active', reward: '150 coins' },
                    { id: 'r3', title: 'Пригласить 5 игроков', status: 'locked', reward: '300 coins' },
                ],
                note: 'Заглушка: получение наград позже',
            },
        };
    }
}
