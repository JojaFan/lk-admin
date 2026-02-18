import { Module } from '@nestjs/common';
import { AdminMarathonsController } from './admin-marathons.controller';
import { AdminMarathonsService } from './admin-marathons.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [AdminMarathonsController],
    providers: [AdminMarathonsService],
})
export class AdminMarathonsModule {}
