import {Body, Controller, Delete, Param, Post, Get} from '@nestjs/common';
import {RewardsService} from './rewards.service';

type CreateRewardDto = {
    // базовое (почти всегда есть)
    item_id?: number;     // id предмета
    amount?: number;      // количество

    // иногда в таблицах иначе называется
    count?: number;
    qty?: number;

    // опционально
    title?: string;
    description?: string;
    probability?: number; // шанс/вес
    sort?: number;
    is_enabled?: number;  // 0/1
};

@Controller('admin')
export class RewardsController {
    constructor(private readonly rewards: RewardsService) {
    }
    @Get('events/:eventId/rewards')
    async list(@Param('eventId') eventId: string) {
        const idNum = Number(eventId);
        if (!Number.isFinite(idNum)) return { ok: false, error: 'bad_event_id' };

        const items = await this.rewards.listByEvent(idNum);
        return { ok: true, items };
    }

    // POST /admin/events/:eventId/rewards
    @Post('events/:eventId/rewards')
    async create(@Param('eventId') eventId: string, @Body() dto: CreateRewardDto) {
        const idNum = Number(eventId);
        if (!Number.isFinite(idNum)) return {ok: false, error: 'bad_event_id'};

        const newId = await this.rewards.createReward(idNum, dto);
        return {ok: true, id: newId};
    }

    // DELETE /admin/rewards/:rewardId
    @Delete('rewards/:rewardId')
    async remove(@Param('rewardId') rewardId: string) {
        const idNum = Number(rewardId);
        if (!Number.isFinite(idNum)) return {ok: false, error: 'bad_reward_id'};

        const deleted = await this.rewards.deleteReward(idNum);
        return {ok: true, deleted};
    }

}