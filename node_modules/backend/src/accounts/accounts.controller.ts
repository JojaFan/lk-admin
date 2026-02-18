import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { JwtUser } from '../auth/types';

type Account = {
    id: number;
    login: string;
    email: string;
    status: 'active' | 'banned';
    createdAt: string;
};

const ACCOUNTS: Account[] = [
    { id: 1001, login: 'alex', email: 'alex@example.com', status: 'active', createdAt: '2025-01-05' },
    { id: 1002, login: 'masha', email: 'masha@example.com', status: 'banned', createdAt: '2024-12-12' },
    { id: 1003, login: 'test_user', email: 'test@example.com', status: 'active', createdAt: '2026-02-01' },
];

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
    // и admin и support могут смотреть аккаунты
    @Get()
    @Roles('admin', 'support')
    list(
        @Query('search') search: string | undefined,
        @Req() req: Request & { user?: JwtUser },
    ) {
        const s = (search || '').trim().toLowerCase();

        const items = !s
            ? ACCOUNTS
            : ACCOUNTS.filter(
                (a) =>
                    a.login.toLowerCase().includes(s) ||
                    a.email.toLowerCase().includes(s) ||
                    String(a.id).includes(s),
            );

        return { ok: true, requestedBy: req.user, items };
    }

    @Get(':id')
    @Roles('admin', 'support')
    getById(@Param('id') id: string, @Req() req: Request & { user?: JwtUser }) {
        const n = Number(id);
        const acc = ACCOUNTS.find((a) => a.id === n);
        return acc
            ? { ok: true, requestedBy: req.user, item: acc }
            : { ok: false, error: 'not_found' };
    }
}