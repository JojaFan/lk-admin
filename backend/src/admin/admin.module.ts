import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminMarathonsModule } from './marathons/admin-marathons.module';

@Module({
    imports: [AuthModule, AdminMarathonsModule],
    controllers: [AdminController],
    providers: [],
})
export class AdminModule {}