import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { AdminMarathonsService } from './admin-marathons.service';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('admin/marathons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminMarathonsController {
    constructor(private readonly svc: AdminMarathonsService) {}

    @Get()
    list() {
        return this.svc.list();
    }

    @Post()
    create(@Body() body: any) {
        return this.svc.create(body);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
        return this.svc.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.svc.remove(id);
    }
}