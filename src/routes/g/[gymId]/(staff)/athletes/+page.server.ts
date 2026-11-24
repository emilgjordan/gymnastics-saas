import { fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, team } from '$lib/server/db/schema';
import { getCurriculum, getStatusesFor, levelProgressFor } from '$lib/server/athletes';
import { staff } from '$lib/server/guards';
import { str } from '$lib/server/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const gymId = params.gymId;
	const [rows, teams, curriculum] = await Promise.all([
		db.select().from(athlete).where(eq(athlete.gymId, gymId)).orderBy(asc(athlete.name)),
		db
			.select({ id: team.id, name: team.name })
			.from(team)
			.where(eq(team.gymId, gymId))
			.orderBy(asc(team.name)),
		getCurriculum(gymId)
	]);
	const statuses = await getStatusesFor(rows.map((r) => r.id));
	return {
		teams,
		levels: curriculum.levels.map((l) => ({ id: l.id, name: l.name })),
		athletes: rows.map((a) => ({
			id: a.id,
			name: a.name,
			birthYear: a.birthYear,
			teamId: a.teamId,
			levelId: a.levelId,
			hasLogin: !!a.userId,
			progress: levelProgressFor(a, curriculum, statuses)
		}))
	};
};

async function validRefs(gymId: string, teamId: string, levelId: string) {
	const curriculum = await getCurriculum(gymId);
	const teams = await db.select({ id: team.id }).from(team).where(eq(team.gymId, gymId));
	return {
		teamId: teams.some((t) => t.id === teamId) ? teamId : null,
		levelId: curriculum.levels.some((l) => l.id === levelId) ? levelId : null
	};
}

export const actions: Actions = {
	create: async (event) => {
		const { gymId } = staff(event);
		const form = await event.request.formData();
		const names = str(form, 'names')
			.split('\n')
			.map((n) => n.trim())
			.filter(Boolean);
		if (!names.length) return fail(400, { message: 'Enter at least one name' });
		if (names.length > 200) return fail(400, { message: 'Add at most 200 athletes at a time' });
		const by = Number(str(form, 'birthYear')) || null;
		const refs = await validRefs(gymId, str(form, 'teamId'), str(form, 'levelId'));
		await db.insert(athlete).values(names.map((name) => ({ gymId, name, birthYear: by, ...refs })));
		return { created: names.length };
	},
	bulkUpdate: async (event) => {
		const { gymId } = staff(event);
		const form = await event.request.formData();
		const ids = form.getAll('ids').map(String);
		if (!ids.length) return fail(400, { message: 'Select athletes first' });
		const field = str(form, 'field');
		const refs = await validRefs(gymId, str(form, 'value'), str(form, 'value'));
		const set =
			field === 'team'
				? { teamId: refs.teamId }
				: field === 'level'
					? { levelId: refs.levelId }
					: null;
		if (!set) return fail(400, { message: 'Unknown field' });
		for (const id of ids) {
			await db
				.update(athlete)
				.set(set)
				.where(and(eq(athlete.id, id), eq(athlete.gymId, gymId)));
		}
		return { updated: ids.length };
	}
};
