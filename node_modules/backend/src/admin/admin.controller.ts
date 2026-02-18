import {Controller, Get, Req, UseGuards, ForbiddenException, Body, Param, Post} from '@nestjs/common';
import type {Request} from 'express';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {Roles} from '../auth/roles.decorator';
import {RolesGuard} from '../auth/roles.guard';
import type {JwtUser} from '../auth/types';
import {BanAccountDto} from './dto/ban-account.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    @Get('users')
    @Roles('admin')
    listAdmins(@Req() req: Request & { user?: JwtUser }) {

        if (!req.user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Access denied');
        }

        return {
            ok: true,
            requestedBy: req.user,
            items: [
                {id: 1, login: 'admin', role: 'admin', status: 'active'},
                {id: 2, login: 'support1', role: 'support', status: 'active'},
            ],
        };
    }

    // ✅ доступно и admin, и support
    @Get('profile')
    @Roles('admin', 'support')
    profile(@Req() req: Request & { user?: JwtUser }) {

        if (!req.user) {
            throw new ForbiddenException('User not authenticated');
        }

        return {ok: true, user: req.user};
    }

    @Post('accounts/:id/ban')
    @Roles('admin')
    banAccount(
        @Req() req: Request & { user?: JwtUser },
        @Param('id') id: string,
        @Body() dto: BanAccountDto
    ) {

        if (!req.user || req.user.role !== 'admin') {
            throw new ForbiddenException('Only admin can ban accounts');
        }

        return {
            ok: true,
            action: 'ban',
            accountId: Number(id),
            duration: dto.duration,
            reason: dto.reason || '',
            ts: Date.now(),
        };
    }

    @Post('accounts/:id/unban')
    @Roles('admin')
    unbanAccount(
        @Req() req: Request & { user?: JwtUser },
        @Param('id') id: string,
    ) {
        if (!req.user || req.user.role !== 'admin') {
            throw new ForbiddenException('Only admin can unban accounts');
        }

        return {
            ok: true,
            action: 'unban',
            accountId: Number(id),
            ts: Date.now(),
        };
    }
}
