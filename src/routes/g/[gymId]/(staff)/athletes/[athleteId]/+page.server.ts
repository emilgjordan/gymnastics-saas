import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, eq, isNull, gt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, invite, member, team, user } from '$lib/server/db/schema';
import {
	getAthleteInGym,
	getAthleteSkills,
	getCurriculum,
	setSkillStatus
} from '$lib/server/athletes';
import { recentActivity } from '$lib/server/activity';
import { createInvite } from '$lib/server/invites';
import { staff } from '$lib/server/guards';
import { str } from '$lib/server/util';
import { isStatus, summarize } from '$lib/progress';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const a = await getAthleteInGym(params.gymId, params.athleteId);
	if (!a) error(404, 'Athlete not found');

	const [curriculum, st, teams, activity, linked, openInvite] = await Promise.all([
		getCurriculum(params.gymId),
		getAthleteSkills(a.id),
		db
			.select({ id: team.id, name: team.name })
			.from(team)
			.where(eq(team.gymId, params.gymId))
			.orderBy(asc(team.name)),
		recentActivity(params.gymId, { athleteId: a.id, limit: 20 }),
		a.userId
			? db.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, a.userId))
			: Promise.resolve([]),
		db
			.select({ token: invite.token, expiresAt: invite.expiresAt })
			.from(invite)
			.where(
				and(eq(invite.athleteId, a.id), isNull(invite.usedAt), gt(invite.expiresAt, new Date()))
			)
			.limit(1)
	]);

	const statuses = Object.fromEntries(
		[...st].map(([k, v]) => [k, { status: v.status, note: v.note, masteredAt: v.masteredAt }])
	);
	const idx = curriculum.levels.findIndex((l) => l.id === a.levelId);
	const nextLevel = idx >= 0 ? (curriculum.levels[idx + 1] ?? null) : null;
	const current = summarize(
		curriculum.skills
			.filter((s) => s.levelId === a.levelId)
			.map((s) => statuses[s.id]?.status ?? 'not_started')
	);

	return {
		athlete: {
			id: a.id,
			name: a.name,
			birthYear: a.birthYear,
			teamId: a.teamId,
			levelId: a.levelId,
			notes: a.notes
		},
		curriculum,
		statuses,
		teams,
		activity,
		login: linked[0] ?? null,
		inviteUrl: openInvite[0] ? `${url.origin}/invite/${openInvite[0].token}` : null,
		current,
		nextLevel
	};
};

async function load404(event: Parameters<Actions[string]>[0]) {
	const s = staff(event);
	const a = await getAthleteInGym(s.gymId, event.params.athleteId!);
	if (!a) error(404, 'Athlete not found');
	return { ...s, a };
}

export const actions: Actions = {
	setStatus: async (event) => {
		const { gymId, userId, a } = await load404(event);
		const form = await event.request.formData();
		const status = form.get('status');
		if (!isStatus(status)) return fail(400, { message: 'Invalid status' });
		const ok = await setSkillStatus({
			gymId,
			athleteId: a.id,
			skillId: str(form, 'skillId'),
			status,
			byUserId: userId
		});
		if (!ok) return fail(400, { message: 'Unknown skill' });
	},
	setNote: async (event) => {
		const { gymId, userId, a } = await load404(event);
		const form = await event.request.formData();
		const skillId = str(form, 'skillId');
		const st = await getAthleteSkills(a.id);
		const status = st.get(skillId)?.status ?? 'not_started';
		await setSkillStatus({
			gymId,
			athleteId: a.id,
			skillId,
			status,
			byUserId: userId,
			note: str(form, 'note')
		});
	},
	update: async (event) => {
		const { gymId, a } = await load404(event);
		const form = await event.request.formData();
		const name = str(form, 'name');
		if (!name) return fail(400, { message: 'Name is required' });
		const curriculum = await getCurriculum(gymId);
		const teams = await db.select({ id: team.id }).from(team).where(eq(team.gymId, gymId));
		const teamId = str(form, 'teamId');
		const levelId = str(form, 'levelId');
		await db
			.update(athlete)
			.set({
				name,
				birthYear: Number(str(form, 'birthYear')) || null,
				notes: str(form, 'notes') || null,
				teamId: teams.some((t) => t.id === teamId) ? teamId : null,
				levelId: curriculum.levels.some((l) => l.id === levelId) ? levelId : null
			})
			.where(eq(athlete.id, a.id));
		return { saved: true };
	},
	moveUp: async (event) => {
		const { gymId, a } = await load404(event);
		const { levels } = await getCurriculum(gymId);
		const idx = levels.findIndex((l) => l.id === a.levelId);
		const next = levels[idx + 1];
		if (idx < 0 || !next) return fail(400, { message: 'No next level' });
		await db.update(athlete).set({ levelId: next.id }).where(eq(athlete.id, a.id));
		return { movedTo: next.name };
	},
	invite: async (event) => {
		const { gymId, userId, a } = await load404(event);
		if (a.userId) return fail(400, { message: 'This athlete already has a login' });
		await createInvite({ gymId, role: 'student', athleteId: a.id, createdBy: userId });
		return { invited: true };
	},
	unlink: async (event) => {
		const { gymId, a } = await load404(event);
		if (a.userId) {
			const uid = a.userId;
			await db.update(athlete).set({ userId: null }).where(eq(athlete.id, a.id));
			// remove the student membership if they no longer have any athlete profile here
			const others = await db
				.select({ id: athlete.id })
				.from(athlete)
				.where(and(eq(athlete.gymId, gymId), eq(athlete.userId, uid)));
			if (!others.length) {
				await db
					.delete(member)
					.where(and(eq(member.gymId, gymId), eq(member.userId, uid), eq(member.role, 'student')));
			}
		}
		return { unlinked: true };
	},
	delete: async (event) => {
		const { gymId, a } = await load404(event);
		await db.delete(athlete).where(eq(athlete.id, a.id));
		redirect(303, `/g/${gymId}/athletes`);
	}
};
