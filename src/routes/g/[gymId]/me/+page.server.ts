import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, team } from '$lib/server/db/schema';
import { getAthleteSkills, getCurriculum } from '$lib/server/athletes';
import { recentActivity } from '$lib/server/activity';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (locals.membership!.role !== 'student') redirect(303, `/g/${params.gymId}`);

	const profiles = await db
		.select({ a: athlete, teamName: team.name })
		.from(athlete)
		.leftJoin(team, eq(team.id, athlete.teamId))
		.where(and(eq(athlete.gymId, params.gymId), eq(athlete.userId, locals.user!.id)));

	const curriculum = await getCurriculum(params.gymId);
	const result = await Promise.all(
		profiles.map(async ({ a, teamName }) => {
			const st = await getAthleteSkills(a.id);
			return {
				athlete: { id: a.id, name: a.name, levelId: a.levelId, teamName },
				statuses: Object.fromEntries(
					[...st].map(([k, v]) => [k, { status: v.status, note: v.note, masteredAt: v.masteredAt }])
				),
				activity: await recentActivity(params.gymId, { athleteId: a.id, limit: 10 })
			};
		})
	);
	return { curriculum, profiles: result };
};
