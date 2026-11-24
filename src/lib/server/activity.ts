import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from './db';
import { athlete, skill, skillLog, user, level } from './db/schema';

export async function recentActivity(
	gymId: string,
	opts: { athleteId?: string; limit?: number } = {}
) {
	return db
		.select({
			id: skillLog.id,
			athleteId: athlete.id,
			athleteName: athlete.name,
			skillName: skill.name,
			levelName: level.name,
			from: skillLog.fromStatus,
			to: skillLog.toStatus,
			by: user.name,
			at: skillLog.createdAt
		})
		.from(skillLog)
		.innerJoin(athlete, eq(athlete.id, skillLog.athleteId))
		.innerJoin(skill, eq(skill.id, skillLog.skillId))
		.innerJoin(level, eq(level.id, skill.levelId))
		.leftJoin(user, eq(user.id, skillLog.byUserId))
		.where(
			and(
				eq(skillLog.gymId, gymId),
				opts.athleteId ? eq(skillLog.athleteId, opts.athleteId) : undefined
			)
		)
		.orderBy(desc(skillLog.createdAt))
		.limit(opts.limit ?? 15);
}

export async function masteredSince(gymId: string, since: Date) {
	const [row] = await db
		.select({ n: sql<number>`count(*)::int` })
		.from(skillLog)
		.where(
			and(
				eq(skillLog.gymId, gymId),
				eq(skillLog.toStatus, 'mastered'),
				gte(skillLog.createdAt, since)
			)
		);
	return row?.n ?? 0;
}
