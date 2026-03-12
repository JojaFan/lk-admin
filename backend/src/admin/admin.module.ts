import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminMarathonsModule } from './marathons/admin-marathons.module';
import { AdminShopModule } from "./shop/admin-shop.module";
import { AdminCalendarModule } from "../calendar/admin-calendar.module";

@Module({
    imports: [AuthModule, AdminMarathonsModule, AdminShopModule, AdminCalendarModule],
    controllers: [AdminController],
    providers: [],
})
export class AdminModule {}