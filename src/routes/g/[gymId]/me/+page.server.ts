import { redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, athleteSkill, team } from '$lib/server/db/schema';
import { getCurriculum } from '$lib/server/athletes';
import { recentActivity } from '$lib/server/activity';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
	if (locals.membership!.role !== 'student') redirect(303, `/g/${params.gymId}`);
	return { me: loadMe(params.gymId, locals.user!.id) };
};

async function loadMe(gymId: string, userId: string) {
	const profilesP = db
		.select({
			id: athlete.id,
			name: athlete.name,
			levelId: athlete.levelId,
			teamName: team.name
		})
		.from(athlete)
		.leftJoin(team, eq(team.id, athlete.teamId))
		.where(and(eq(athlete.gymId, gymId), eq(athlete.userId, userId)));

	const [curriculum, profiles] = await Promise.all([getCurriculum(gymId), profilesP]);
	const ids = profiles.map((p) => p.id);
	const [skillRows, activities] = await Promise.all([
		ids.length
			? db
					.select({
						athleteId: athleteSkill.athleteId,
						skillId: athleteSkill.skillId,
						status: athleteSkill.status,
						note: athleteSkill.note,
						masteredAt: athleteSkill.masteredAt
					})
					.from(athleteSkill)
					.where(inArray(athleteSkill.athleteId, ids))
			: [],
		Promise.all(ids.map((id) => recentActivity(gymId, { athleteId: id, limit: 10 })))
	]);

	return {
		curriculum,
		profiles: profiles.map((a, i) => ({
			athlete: a,
			statuses: Object.fromEntries(
				skillRows
					.filter((r) => r.athleteId === a.id)
					.map((r) => [r.skillId, { status: r.status, note: r.note, masteredAt: r.masteredAt }])
			),
			activity: activities[i]
		}))
	};
}
