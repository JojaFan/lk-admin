import {Module} from '@nestjs/common';
import {AuthModule} from './auth/auth.module';
import {AdminModule} from './admin/admin.module';
import {AccountsModule} from './accounts/accounts.module';
import {LkModule} from './lk/lk.module';
import { AdminMarathonsModule } from './admin/marathons/admin-marathons.module';
import { EventsModule } from './admin/marathons/events/events.module';
import { RewardsModule } from './admin/marathons/rewards/rewards.module';
import { StatsModule } from './admin/marathons/stats/stats.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
    imports: [AuthModule, AdminModule, AccountsModule, LkModule, AdminMarathonsModule, EventsModule, RewardsModule, StatsModule, InventoryModule],

})
export class AppModule {
}