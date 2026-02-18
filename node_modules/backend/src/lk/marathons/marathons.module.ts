import {Module} from '@nestjs/common';
import {MarathonsController} from './marathons.controller';
import {MarathonsService} from './marathons.service';

@Module({
    controllers: [MarathonsController],
    providers: [MarathonsService],
    exports: [MarathonsService],
})
export class MarathonsModule {
}