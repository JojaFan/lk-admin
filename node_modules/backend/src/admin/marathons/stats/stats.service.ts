import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsService {
    async getStats(marathonId: number) {
        // Пока mock (чтобы фронт мог работать)
        return {
            ok: true,
            marathonId,
            started: 0,
            completed: 0,
            claimed: 0,
            top: [],
        };
    }
}