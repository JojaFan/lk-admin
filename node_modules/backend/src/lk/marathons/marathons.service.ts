import {Injectable, NotFoundException} from '@nestjs/common';
import {pool} from '../../db/mysql';
import type {RowDataPacket} from 'mysql2';

type MarathonStatus = 'active' | 'past' | 'future';

type MarathonRow = RowDataPacket & {
    id: number;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    is_enabled: number;
};

type EventRow = RowDataPacket & {
    id: number;
    marathon_id: number;
    title: string;
    description: string | null;
    start_at: string;
    end_at: string;
    condition_type: 'kill_mob' | 'online_hours' | 'char_level' | string;
    condition_value: number;
    required_count: number;
};

type Reward = { item_id: number; item_count: number };

type EventWithProgress = EventRow & {
    rewards: Reward[];
    progress: {
        value: number;
        target: number;
        percent: number;
        completed: boolean;
    };
};

@Injectable()
export class MarathonsService {
    // ⚙️ Настройка единиц времени в point.time
    // если это секунды -> 3600; если минуты -> 60
    private readonly ONLINE_TIME_DIVISOR = 3600;

    async listMarathons(userId: number, status: MarathonStatus) {
        const nowExpr = 'NOW()';
        let whereStatus = '';

        if (status === 'active') whereStatus = `AND start_at <= ${nowExpr} AND end_at >= ${nowExpr}`;
        if (status === 'past') whereStatus = `AND end_at < ${nowExpr}`;
        if (status === 'future') whereStatus = `AND start_at > ${nowExpr}`;

        const sql = `
            SELECT id, title, description, start_at, end_at, is_enabled
            FROM marathons
            WHERE is_enabled = 1
                ${whereStatus}
            ORDER BY start_at DESC
        `;
        const [rows] = await pool.query<MarathonRow[]>(sql);

        // можно вернуть “счётчики” по желанию, но пока просто список
        return {ok: true, status, marathons: rows};
    }

    async claimEventReward(userId: number, eventId: number) {
        // 1) load event
        const [eRows] = await pool.query<RowDataPacket[]>(
            `SELECT id,
                    marathon_id,
                    title,
                    description,
                    start_at,
                    end_at,
                    condition_type,
                    condition_value,
                    required_count
             FROM marathon_events
             WHERE id = ? LIMIT 1`,
            [eventId],
        );
        const ev = eRows[0] as any;
        if (!ev) throw new NotFoundException('Event not found');

        // 2) compute progress live (честнее, чем верить кешу)
        const computed = await this.computeProgress(userId, ev);
        await this.upsertProgress(userId, eventId, computed.value, computed.completed);

        if (!computed.completed) {
            return {
                ok: false,
                message: 'Условие не выполнено',
                progress: {value: computed.value, target: computed.target},
            };
        }

        // 3) already claimed?
        const [cRows] = await pool.query<RowDataPacket[]>(
            `SELECT id
             FROM marathon_user_event_claims
             WHERE event_id = ?
               AND user_id = ? LIMIT 1`,
            [eventId, userId],
        );
        if (cRows.length) {
            return {ok: false, message: 'Награда уже получена'};
        }

        // 4) rewards
        const [rRows] = await pool.query<RowDataPacket[]>(
            `SELECT item_id, item_count
             FROM marathon_event_rewards
             WHERE event_id = ?
             ORDER BY id ASC`,
            [eventId],
        );

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1) фиксируем claim (и не даём второй раз)
            await conn.query(
                `INSERT INTO marathon_user_event_claims (event_id, user_id)
                 VALUES (?, ?)`,
                [eventId, userId],
            );

            // 2) апсерты в инвентарь
            for (const r of rRows as any[]) {
                const itemId = Number(r.item_id);
                const add = Number(r.item_count);

                await conn.query(
                    `
                        INSERT INTO lk_items (user_id, item_id, item_count)
                        VALUES (?, ?, ?) ON DUPLICATE KEY
                        UPDATE item_count = item_count +
                        VALUES (item_count)
                    `,
                    [userId, itemId, add],
                );

                await conn.query(
                    `
                        INSERT INTO lk_items_log (user_id, item_id, delta, reason, ref_type, ref_id)
                        VALUES (?, ?, ?, 'marathon_claim', 'event', ?)
                    `,
                    [userId, itemId, add, eventId],
                );
            }

            await conn.commit();

            return {
                ok: true,
                message: 'Награда выдана в инвентарь ЛК',
                rewards: (rRows as any[]).map((r) => ({item_id: Number(r.item_id), item_count: Number(r.item_count)})),
            };
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }

    async getMarathonDetails(userId: number, marathonId: number) {
        const [mRows] = await pool.query<MarathonRow[]>(
            `SELECT id, title, description, start_at, end_at, is_enabled
             FROM marathons
             WHERE id = ? LIMIT 1`,
            [marathonId],
        );

        const marathon = mRows[0];
        if (!marathon) throw new NotFoundException('Marathon not found');

        const [events] = await pool.query<EventRow[]>(
            `SELECT id,
                    marathon_id,
                    title,
                    description,
                    start_at,
                    end_at,
                    condition_type,
                    condition_value,
                    required_count
             FROM marathon_events
             WHERE marathon_id = ?
             ORDER BY id ASC`,
            [marathonId],
        );

        // rewards for all events
        const eventIds = events.map((e) => e.id);
        let rewardsByEvent: Record<number, Reward[]> = {};
        if (eventIds.length) {
            const [rRows] = await pool.query<RowDataPacket[]>(
                `SELECT event_id, item_id, item_count
                 FROM marathon_event_rewards
                 WHERE event_id IN (${eventIds.map(() => '?').join(',')})
                 ORDER BY id ASC`,
                eventIds,
            );

            rewardsByEvent = rRows.reduce((acc: any, r: any) => {
                const eid = Number(r.event_id);
                acc[eid] ||= [];
                acc[eid].push({item_id: Number(r.item_id), item_count: Number(r.item_count)});
                return acc;
            }, {});
        }

        // compute + upsert progress per event
        const enriched: EventWithProgress[] = [];
        for (const ev of events) {
            const computed = await this.computeProgress(userId, ev);
            await this.upsertProgress(userId, ev.id, computed.value, computed.completed);

            const target = computed.target;
            const percent = target > 0 ? Math.min(100, Math.floor((computed.value / target) * 100)) : (computed.completed ? 100 : 0);

            enriched.push({
                ...ev,
                rewards: rewardsByEvent[ev.id] ?? [],
                progress: {
                    value: computed.value,
                    target,
                    percent,
                    completed: computed.completed,
                },
            });
        }

        return {
            ok: true,
            marathon,
            events: enriched,
        };
    }

    async trackKill(data: { userId: number; charId: number; mobId: number; qty?: number }) {
        const {userId, charId, mobId} = data;
        const qty = data.qty ?? 1;

        await pool.query(
            `
                INSERT INTO marathon_kill_log (user_id, char_id, mob_id, qty)
                VALUES (?, ?, ?, ?)
            `,
            [userId, charId, mobId, qty],
        );

        return {ok: true};
    }

    private async computeProgress(userId: number, ev: EventRow): Promise<{
        value: number;
        target: number;
        completed: boolean
    }> {
        if (ev.condition_type === 'char_level') {
            // max char level in base by account
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT COALESCE(MAX(level), 0) AS maxLevel
                 FROM base
                 WHERE akkid = ?`,
                [userId],
            );
            const maxLevel = Number((rows[0] as any)?.maxLevel ?? 0);
            const target = Number(ev.condition_value || 0);
            const completed = maxLevel >= target;
            return {value: maxLevel, target, completed};
        }

        if (ev.condition_type === 'online_hours') {
            // sum time in point by account
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT COALESCE(SUM(time), 0) AS totalTime
                 FROM point
                 WHERE aid = ?`,
                [userId],
            );
            const totalTime = Number((rows[0] as any)?.totalTime ?? 0);
            const hours = Math.floor(totalTime / this.ONLINE_TIME_DIVISOR);
            const target = Number(ev.required_count || 0);
            const completed = hours >= target;
            return {value: hours, target, completed};
        }

        if (ev.condition_type === 'kill_mob') {
            const mobId = Number(ev.condition_value || 0);
            // count kills in our log within event time
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT COALESCE(SUM(qty), 0) AS kills
                 FROM marathon_kill_log
                 WHERE user_id = ?
                   AND mob_id = ?
                   AND killed_at BETWEEN ? AND ?`,
                [userId, mobId, ev.start_at, ev.end_at],
            );
            const kills = Number((rows[0] as any)?.kills ?? 0);
            const target = Number(ev.required_count || 0);
            const completed = kills >= target;
            return {value: kills, target, completed};
        }

        // unknown type
        return {value: 0, target: Number(ev.required_count || 0), completed: false};
    }

    private async upsertProgress(userId: number, eventId: number, value: number, completed: boolean) {
        // idempotent upsert
        await pool.query(
            `
                INSERT INTO marathon_user_event_progress (event_id, user_id, progress_value, is_completed, completed_at)
                VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY
                UPDATE
                    progress_value =
                VALUES (progress_value), is_completed =
                VALUES (is_completed), completed_at = IF(VALUES (is_completed)=1 AND completed_at IS NULL, VALUES (completed_at), completed_at)
            `,
            [eventId, userId, value, completed ? 1 : 0, completed ? new Date() : null],
        );
    }
}