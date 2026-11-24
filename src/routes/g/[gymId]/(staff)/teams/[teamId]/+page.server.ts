import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, inArray, ne, or, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, member, team, teamCoach, user } from '$lib/server/db/schema';
import {
	getAthleteInGym,
	getCurriculum,
	getStatusesFor,
	levelProgressFor,
	setSkillStatus
} from '$lib/server/athletes';
import { staff } from '$lib/server/guards';
import { str } from '$lib/server/util';
import { isStatus } from '$lib/progress';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

async function getTeam(gymId: string, teamId: string) {
	const [t] = await db
		.select()
		.from(team)
		.where(and(eq(team.id, teamId), eq(team.gymId, gymId)));
	if (!t) error(404, 'Team not found');
	return t;
}

export const load: PageServerLoad = async ({ params }) => {
	const t = await getTeam(params.gymId, params.teamId);
	const [athletes, coaches, staffMembers, others, curriculum] = await Promise.all([
		db.select().from(athlete).where(eq(athlete.teamId, t.id)).orderBy(asc(athlete.name)),
		db
			.select({ memberId: member.id, name: user.name, email: user.email })
			.from(teamCoach)
			.innerJoin(member, eq(member.id, teamCoach.memberId))
			.innerJoin(user, eq(user.id, member.userId))
			.where(eq(teamCoach.teamId, t.id)),
		db
			.select({ memberId: member.id, name: user.name })
			.from(member)
			.innerJoin(user, eq(user.id, member.userId))
			.where(and(eq(member.gymId, params.gymId), ne(member.role, 'student')))
			.orderBy(asc(user.name)),
		db
			.select({ id: athlete.id, name: athlete.name })
			.from(athlete)
			.where(
				and(eq(athlete.gymId, params.gymId), or(isNull(athlete.teamId), ne(athlete.teamId, t.id)))
			)
			.orderBy(asc(athlete.name)),
		getCurriculum(params.gymId)
	]);
	const statusMap = await getStatusesFor(athletes.map((a) => a.id));
	const statuses: Record<string, Record<string, string>> = {};
	for (const [aid, m] of statusMap) statuses[aid] = Object.fromEntries(m);

	// default matrix level = most common level on the team
	const counts = new Map<string, number>();
	for (const a of athletes) if (a.levelId) counts.set(a.levelId, (counts.get(a.levelId) ?? 0) + 1);
	const defaultLevelId =
		[...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? curriculum.levels[0]?.id ?? null;

	return {
		team: t,
		athletes: athletes.map((a) => ({
			id: a.id,
			name: a.name,
			levelId: a.levelId,
			progress: levelProgressFor(a, curriculum, statusMap)
		})),
		coaches,
		availableCoaches: staffMembers.filter((s) => !coaches.some((c) => c.memberId === s.memberId)),
		otherAthletes: others,
		curriculum,
		statuses,
		defaultLevelId
	};
};

async function ctx(event: RequestEvent) {
	const s = staff(event);
	const t = await getTeam(s.gymId, event.params.teamId);
	return { ...s, t };
}

export const actions: Actions = {
	update: async (event) => {
		const { t } = await ctx(event);
		const form = await event.request.formData();
		const name = str(form, 'name');
		if (!name) return fail(400, { message: 'Name is required' });
		await db
			.update(team)
			.set({ name, description: str(form, 'description') || null })
			.where(eq(team.id, t.id));
	},
	delete: async (event) => {
		const { gymId, t } = await ctx(event);
		await db.delete(team).where(eq(team.id, t.id));
		redirect(303, `/g/${gymId}/teams`);
	},
	addCoach: async (event) => {
		const { gymId, t } = await ctx(event);
		const memberId = str(await event.request.formData(), 'memberId');
		const [m] = await db
			.select({ id: member.id })
			.from(member)
			.where(and(eq(member.id, memberId), eq(member.gymId, gymId), ne(member.role, 'student')));
		if (!m) return fail(400, { message: 'Unknown coach' });
		await db.insert(teamCoach).values({ teamId: t.id, memberId }).onConflictDoNothing();
	},
	removeCoach: async (event) => {
		const { t } = await ctx(event);
		const memberId = str(await event.request.formData(), 'memberId');
		await db
			.delete(teamCoach)
			.where(and(eq(teamCoach.teamId, t.id), eq(teamCoach.memberId, memberId)));
	},
	addAthletes: async (event) => {
		const { gymId, t } = await ctx(event);
		const ids = (await event.request.formData()).getAll('athleteIds').map(String);
		if (ids.length)
			await db
				.update(athlete)
				.set({ teamId: t.id })
				.where(and(eq(athlete.gymId, gymId), inArray(athlete.id, ids)));
	},
	removeAthlete: async (event) => {
		const { t } = await ctx(event);
		const id = str(await event.request.formData(), 'athleteId');
		await db
			.update(athlete)
			.set({ teamId: null })
			.where(and(eq(athlete.id, id), eq(athlete.teamId, t.id)));
	},
	setStatus: async (event) => {
		const { gymId, userId } = await ctx(event);
		const form = await event.request.formData();
		const status = form.get('status');
		if (!isStatus(status)) return fail(400, { message: 'Invalid status' });
		const a = await getAthleteInGym(gymId, str(form, 'athleteId'));
		if (!a) return fail(404, { message: 'Athlete not found' });
		await setSkillStatus({
			gymId,
			athleteId: a.id,
			skillId: str(form, 'skillId'),
			status,
			byUserId: userId
		});
	}
};
