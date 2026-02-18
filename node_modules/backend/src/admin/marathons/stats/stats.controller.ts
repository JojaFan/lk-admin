import { Controller, Get, Param } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('admin/marathons')
export class StatsController {
    constructor(private readonly stats: StatsService) {}

    @Get(':id/stats')
    async getStats(@Param('id') id: string) {
        const marathonId = Number(id);
        if (!Number.isFinite(marathonId)) {
            return { ok: false, error: 'bad_marathon_id' };
        }

        return this.stats.getStats(marathonId);
    }
}