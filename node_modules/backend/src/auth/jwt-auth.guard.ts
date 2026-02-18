import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import type {Request} from 'express';
import type {JwtUser} from './types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private jwt: JwtService) {
    }

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();

        const token = req.cookies?.access_token;
        if (!token) throw new UnauthorizedException('unauthorized');

        try {
            const p = this.jwt.verify(token) as any;
            req.user = {id: p.sub, login: p.login, role: p.role} satisfies JwtUser;
            return true;
        } catch {
            throw new UnauthorizedException('unauthorized');
        }
    }
}