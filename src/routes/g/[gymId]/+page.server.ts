import { redirect } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, member, team, teamCoach } from '$lib/server/db/schema';
import { getCurriculum, getStatusesForGym, levelProgressFor } from '$lib/server/athletes';
import { masteredSince, recentActivity } from '$lib/server/activity';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
	if (locals.membership!.role === 'student') redirect(303, `/g/${params.gymId}/me`);
	// Streamed: navigation commits immediately and the page shows a skeleton until this resolves.
	return { dashboard: loadDashboard(params.gymId, locals.membership!.id) };
};

async function loadDashboard(gymId: string, memberId: string) {
	const [athletes, teams, coachCount, curriculum, activity, mastered30, myTeamRows, statuses] =
		await Promise.all([
			db
				.select({
					id: athlete.id,
					name: athlete.name,
					levelId: athlete.levelId,
					teamId: athlete.teamId
				})
				.from(athlete)
				.where(eq(athlete.gymId, gymId)),
			db
				.select({ id: team.id, name: team.name })
				.from(team)
				.where(eq(team.gymId, gymId))
				.orderBy(team.name),
			db
				.select({ n: sql<number>`count(*)::int` })
				.from(member)
				.where(and(eq(member.gymId, gymId), sql`${member.role} <> 'student'`)),
			getCurriculum(gymId),
			recentActivity(gymId, { limit: 12 }),
			masteredSince(gymId, new Date(Date.now() - 30 * 86400_000)),
			db
				.select({ teamId: teamCoach.teamId })
				.from(teamCoach)
				.where(eq(teamCoach.memberId, memberId)),
			getStatusesForGym(gymId)
		]);

	const levelName = Object.fromEntries(curriculum.levels.map((l) => [l.id, l.name]));
	const ready = athletes
		.map((a) => ({ ...a, progress: levelProgressFor(a, curriculum, statuses) }))
		.filter((a) => a.progress?.readyToMoveUp)
		.map((a) => ({
			id: a.id,
			name: a.name,
			level: levelName[a.levelId!],
			next: a.progress!.nextLevel!.name
		}));

	const myTeamIds = new Set(myTeamRows.map((r) => r.teamId));
	const teamSummaries = teams.map((t) => {
		const members = athletes.filter((a) => a.teamId === t.id);
		const progresses = members
			.map((a) => levelProgressFor(a, curriculum, statuses))
			.filter((p) => p !== null);
		const avg = progresses.length
			? Math.round(progresses.reduce((s, p) => s + p.percent, 0) / progresses.length)
			: 0;
		return { ...t, athletes: members.length, avg, mine: myTeamIds.has(t.id) };
	});
	teamSummaries.sort((a, b) => Number(b.mine) - Number(a.mine));

	return {
		stats: {
			athletes: athletes.length,
			teams: teams.length,
			coaches: coachCount[0]?.n ?? 0,
			mastered30,
			skills: curriculum.skills.length
		},
		ready,
		activity,
		teams: teamSummaries,
		unassigned: athletes.filter((a) => !a.levelId).length
	};
}
