import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, member, team, teamCoach, user } from '$lib/server/db/schema';
import { getCurriculum, getStatusesFor, levelProgressFor } from '$lib/server/athletes';
import { staff } from '$lib/server/guards';
import { str } from '$lib/server/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const gymId = params.gymId;
	const [teams, athletes, coaches, curriculum] = await Promise.all([
		db.select().from(team).where(eq(team.gymId, gymId)).orderBy(asc(team.name)),
		db
			.select({ id: athlete.id, teamId: athlete.teamId, levelId: athlete.levelId })
			.from(athlete)
			.where(eq(athlete.gymId, gymId)),
		db
			.select({ teamId: teamCoach.teamId, name: user.name })
			.from(teamCoach)
			.innerJoin(member, eq(member.id, teamCoach.memberId))
			.innerJoin(user, eq(user.id, member.userId))
			.where(eq(member.gymId, gymId)),
		getCurriculum(gymId)
	]);
	const statuses = await getStatusesFor(athletes.map((a) => a.id));
	return {
		teams: teams.map((t) => {
			const members = athletes.filter((a) => a.teamId === t.id);
			const progs = members
				.map((a) => levelProgressFor(a, curriculum, statuses))
				.filter((p) => p !== null);
			return {
				...t,
				athleteCount: members.length,
				coaches: coaches.filter((c) => c.teamId === t.id).map((c) => c.name),
				avg: progs.length ? Math.round(progs.reduce((s, p) => s + p.percent, 0) / progs.length) : 0,
				ready: progs.filter((p) => p.readyToMoveUp).length
			};
		})
	};
};

export const actions: Actions = {
	create: async (event) => {
		const { gymId, memberId } = staff(event);
		const form = await event.request.formData();
		const name = str(form, 'name');
		if (!name) return fail(400, { message: 'Team name is required' });
		const [t] = await db
			.insert(team)
			.values({ gymId, name, description: str(form, 'description') || null })
			.returning();
		if (form.get('assignMe') === 'on')
			await db.insert(teamCoach).values({ teamId: t.id, memberId });
		redirect(303, `/g/${gymId}/teams/${t.id}`);
	}
};
