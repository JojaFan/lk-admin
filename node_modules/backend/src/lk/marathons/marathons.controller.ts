import {Controller, Get, Param, Query, ParseIntPipe, Body, Headers, Post, UnauthorizedException,} from '@nestjs/common';
import {MarathonsService} from './marathons.service';

@Controller('lk/marathons')
export class MarathonsController {
    constructor(private readonly marathons: MarathonsService) {
    }

    // GET /lk/marathons?status=active|past|future
    @Get()
    list(@Query('status') status?: 'active' | 'past' | 'future') {
        const userId = 1; // TODO: заменить на JWT
        return this.marathons.listMarathons(userId, status ?? 'active');
    }


    // GET /lk/marathons/:id
    @Get(':id')
    details(@Param('id', ParseIntPipe) id: number) {
        const userId = 1;
        return this.marathons.getMarathonDetails(userId, id);
    }

    @Post('track-kill')
    async trackKill(
        @Headers('x-lk-secret') secret: string,
        @Body() body: { userId: number; charId: number; mobId: number; qty?: number },
    ) {
        if (secret !== process.env.LK_SECRET) {
            throw new UnauthorizedException('Invalid secret');
        }
        console.log('LK_SECRET env =', process.env.LK_SECRET);
        console.log('header secret =', secret);

        return this.marathons.trackKill(body);

    }

    @Post('events/:eventId/claim')
    claim(@Param('eventId', ParseIntPipe) eventId: number) {
        const userId = 1; // TODO: JWT позже
        return this.marathons.claimEventReward(userId, eventId);
    }
}
