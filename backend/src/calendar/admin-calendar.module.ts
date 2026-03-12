import { Module } from "@nestjs/common";
import { AdminCalendarController } from "./admin-calendar.controller";
import { AdminCalendarService } from "./admin-calendar.service";

@Module({
    controllers: [AdminCalendarController],
    providers: [AdminCalendarService],
})
export class AdminCalendarModule {}