import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { AdminCalendarService } from "./admin-calendar.service";

@Controller("admin/calendar")
export class AdminCalendarController {
    constructor(private readonly svc: AdminCalendarService) {}

    @Get()
    async getMonth(@Query("month") month: string) {
        const items = await this.svc.getMonth(month);
        return { ok: true, month, slotsPerDay: 4, items };
    }

    @Put()
    async saveMonth(
        @Query("month") month: string,
        @Body() body: { slotsPerDay?: number; items: Array<{ day: string; slot: number; itemId: number; qty: number }> },
    ) {
        const res = await this.svc.saveMonth(month, body.items || []);
        return { ok: true, month, ...res };
    }
}