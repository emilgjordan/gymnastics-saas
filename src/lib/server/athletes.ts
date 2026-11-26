import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { apparatus, athlete, athleteSkill, level, skill, skillLog } from './db/schema';
import { summarize, type SkillStatus } from '$lib/progress';

export async function getCurriculum(gymId: string) {
	const [levels, events, skills] = await Promise.all([
		db
			.select({ id: level.id, name: level.name })
			.from(level)
			.where(eq(level.gymId, gymId))
			.orderBy(asc(level.sortOrder), asc(level.name)),
		db
			.select({ id: apparatus.id, name: apparatus.name })
			.from(apparatus)
			.where(eq(apparatus.gymId, gymId))
			.orderBy(asc(apparatus.sortOrder), asc(apparatus.name)),
		db
			.select({
				id: skill.id,
				name: skill.name,
				description: skill.description,
				levelId: skill.levelId,
				apparatusId: skill.apparatusId
			})
			.from(skill)
			.where(eq(skill.gymId, gymId))
			.orderBy(asc(skill.sortOrder), asc(skill.name))
	]);
	return { levels, events, skills };
}

export type Curriculum = Awaited<ReturnType<typeof getCurriculum>>;

/** Map of skillId -> status record for one athlete. */
export async function getAthleteSkills(athleteId: string) {
	const rows = await db.select().from(athleteSkill).where(eq(athleteSkill.athleteId, athleteId));
	return new Map(rows.map((r) => [r.skillId, r]));
}

type StatusRow = { athleteId: string; skillId: string; status: SkillStatus };

function toStatusMap(rows: StatusRow[]) {
	const map = new Map<string, Map<string, SkillStatus>>();
	for (const r of rows) {
		let m = map.get(r.athleteId);
		if (!m) map.set(r.athleteId, (m = new Map()));
		m.set(r.skillId, r.status);
	}
	return map;
}

/** Map athleteId -> (skillId -> status) for many athletes. */
export async function getStatusesFor(athleteIds: string[]) {
	if (!athleteIds.length) return new Map<string, Map<string, SkillStatus>>();
	const rows = await db
		.select({
			athleteId: athleteSkill.athleteId,
			skillId: athleteSkill.skillId,
			status: athleteSkill.status
		})
		.from(athleteSkill)
		.where(inArray(athleteSkill.athleteId, athleteIds));
	return toStatusMap(rows);
}

/**
 * Same as getStatusesFor, but scoped by gym (and optionally team) via a join, so it
 * can run in parallel with the athlete query instead of waiting for its ids.
 */
export async function getStatusesForGym(gymId: string, opts: { teamId?: string } = {}) {
	const rows = await db
		.select({
			athleteId: athleteSkill.athleteId,
			skillId: athleteSkill.skillId,
			status: athleteSkill.status
		})
		.from(athleteSkill)
		.innerJoin(athlete, eq(athlete.id, athleteSkill.athleteId))
		.where(
			and(eq(athlete.gymId, gymId), opts.teamId ? eq(athlete.teamId, opts.teamId) : undefined)
		);
	return toStatusMap(rows);
}

/** Progress of each athlete through their *current* level, plus the next level. */
export function levelProgressFor(
	ath: { id: string; levelId: string | null },
	curriculum: Curriculum,
	statuses: Map<string, Map<string, SkillStatus>>
) {
	if (!ath.levelId) return null;
	const skills = curriculum.skills.filter((s) => s.levelId === ath.levelId);
	const st = statuses.get(ath.id);
	const progress = summarize(skills.map((s) => st?.get(s.id) ?? 'not_started'));
	const idx = curriculum.levels.findIndex((l) => l.id === ath.levelId);
	const nextLevel = idx >= 0 ? (curriculum.levels[idx + 1] ?? null) : null;
	return { ...progress, nextLevel, readyToMoveUp: progress.complete && nextLevel !== null };
}

export async function getAthleteInGym(gymId: string, athleteId: string) {
	const [a] = await db
		.select()
		.from(athlete)
		.where(and(eq(athlete.id, athleteId), eq(athlete.gymId, gymId)))
		.limit(1);
	return a ?? null;
}

/** Set a skill status for an athlete and record a history entry. */
export async function setSkillStatus(opts: {
	gymId: string;
	athleteId: string;
	skillId: string;
	status: SkillStatus;
	byUserId: string;
	note?: string | null;
}) {
	const [sk] = await db
		.select({ id: skill.id })
		.from(skill)
		.where(and(eq(skill.id, opts.skillId), eq(skill.gymId, opts.gymId)))
		.limit(1);
	if (!sk) return false;

	await db.transaction(async (tx) => {
		const [existing] = await tx
			.select()
			.from(athleteSkill)
			.where(
				and(eq(athleteSkill.athleteId, opts.athleteId), eq(athleteSkill.skillId, opts.skillId))
			)
			.limit(1);
		const from = existing?.status ?? 'not_started';
		const now = new Date();
		const masteredAt =
			opts.status === 'mastered'
				? from === 'mastered'
					? (existing?.masteredAt ?? now)
					: now
				: null;
		const note = opts.note === undefined ? (existing?.note ?? null) : opts.note || null;

		await tx
			.insert(athleteSkill)
			.values({
				athleteId: opts.athleteId,
				skillId: opts.skillId,
				status: opts.status,
				note,
				masteredAt,
				updatedAt: now,
				updatedBy: opts.byUserId
			})
			.onConflictDoUpdate({
				target: [athleteSkill.athleteId, athleteSkill.skillId],
				set: { status: opts.status, note, masteredAt, updatedAt: now, updatedBy: opts.byUserId }
			});

		if (from !== opts.status) {
			await tx.insert(skillLog).values({
				gymId: opts.gymId,
				athleteId: opts.athleteId,
				skillId: opts.skillId,
				fromStatus: from,
				toStatus: opts.status,
				byUserId: opts.byUserId
			});
		}
	});
	return true;
}
