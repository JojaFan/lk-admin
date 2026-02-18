import {Module} from '@nestjs/common';
import {LkController} from './lk.controller';
import {LkService} from './lk.service';
import {MarathonsModule} from './marathons/marathons.module';
import { AuthModule } from '../auth/auth.module';


@Module({
    imports: [MarathonsModule, AuthModule],
    controllers: [LkController],
    providers: [LkService],
})
export class LkModule {
}