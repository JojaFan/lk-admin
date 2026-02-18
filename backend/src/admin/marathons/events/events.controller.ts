import { Body, Controller, Delete, Param, Post, Put, Get} from '@nestjs/common';
import { EventsService } from './events.service';

type CreateEventDto = {
    title: string;
    description?: string;
    start_at: string; // "YYYY-MM-DD HH:mm:ss"
    end_at: string;   // "YYYY-MM-DD HH:mm:ss"
    is_enabled?: number; // 0/1
    sort?: number;
};

type UpdateEventDto = Partial<CreateEventDto>;

@Controller('admin')
export class EventsController {
    constructor(private readonly events: EventsService) {}

    // POST /admin/marathons/:id/events
    @Post('marathons/:id/events')
    async create(@Param('id') marathonId: string, @Body() dto: CreateEventDto) {
        const idNum = Number(marathonId);
        if (!Number.isFinite(idNum)) return { ok: false, error: 'bad_marathon_id' };

        const newId = await this.events.createEvent(idNum, dto);
        return { ok: true, id: newId };
    }

    // PUT /admin/events/:eventId
    @Put('events/:eventId')
    async update(@Param('eventId') eventId: string, @Body() dto: UpdateEventDto) {
        const idNum = Number(eventId);
        if (!Number.isFinite(idNum)) return { ok: false, error: 'bad_event_id' };

        const changed = await this.events.updateEvent(idNum, dto);
        return { ok: true, changed };
    }

    // DELETE /admin/events/:eventId
    @Delete('events/:eventId')
    async remove(@Param('eventId') eventId: string) {
        const idNum = Number(eventId);
        if (!Number.isFinite(idNum)) return { ok: false, error: 'bad_event_id' };

        const deleted = await this.events.deleteEvent(idNum);
        return { ok: true, deleted };
    }
    @Get('marathons/:id/events')
    async list(@Param('id') marathonId: string) {
        const idNum = Number(marathonId);
        if (!Number.isFinite(idNum)) return { ok: false, error: 'bad_marathon_id' };

        const items = await this.events.listByMarathon(idNum);
        return { ok: true, items };
    }
}