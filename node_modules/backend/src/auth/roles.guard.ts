import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import type {Request} from 'express';
import {ROLES_KEY} from './roles.decorator';
import type {JwtUser} from './types';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {
    }

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // если роли не заданы — доступ разрешён
        if (!roles || roles.length === 0) return true;

        const req = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();
        const user = req.user;

        if (!user) throw new ForbiddenException('forbidden');
        if (!roles.includes(user.role)) throw new ForbiddenException('forbidden');

        return true;
    }
}