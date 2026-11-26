import { fail } from '@sveltejs/kit';
import { and, asc, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, invite, member, user } from '$lib/server/db/schema';
import { createInvite } from '$lib/server/invites';
import { owner } from '$lib/server/guards';
import { str } from '$lib/server/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => ({
	people: loadPeople(params.gymId, url.origin)
});

async function loadPeople(gymId: string, origin: string) {
	const [members, invites, linked] = await Promise.all([
		db
			.select({
				id: member.id,
				role: member.role,
				userId: user.id,
				name: user.name,
				email: user.email,
				since: member.createdAt
			})
			.from(member)
			.innerJoin(user, eq(user.id, member.userId))
			.where(eq(member.gymId, gymId))
			.orderBy(asc(user.name)),
		db
			.select({
				id: invite.id,
				token: invite.token,
				role: invite.role,
				expiresAt: invite.expiresAt
			})
			.from(invite)
			.where(
				and(
					eq(invite.gymId, gymId),
					isNull(invite.usedAt),
					isNull(invite.athleteId),
					gt(invite.expiresAt, new Date())
				)
			)
			.orderBy(desc(invite.createdAt)),
		db
			.select({ userId: athlete.userId, name: athlete.name, id: athlete.id })
			.from(athlete)
			.where(eq(athlete.gymId, gymId))
	]);
	return {
		staff: members.filter((m) => m.role !== 'student'),
		students: members
			.filter((m) => m.role === 'student')
			.map((m) => ({ ...m, athletes: linked.filter((a) => a.userId === m.userId) })),
		invites: invites.map((i) => ({ ...i, url: `${origin}/invite/${i.token}` }))
	};
}

async function ownerCount(gymId: string) {
	return (
		await db
			.select({ id: member.id })
			.from(member)
			.where(and(eq(member.gymId, gymId), eq(member.role, 'owner')))
	).length;
}

export const actions: Actions = {
	invite: async (event) => {
		const { gymId, userId } = owner(event);
		const role = str(await event.request.formData(), 'role') === 'owner' ? 'owner' : 'coach';
		await createInvite({ gymId, role, createdBy: userId, days: 7 });
		return { invited: true };
	},
	revoke: async (event) => {
		const { gymId } = owner(event);
		const id = str(await event.request.formData(), 'id');
		await db.delete(invite).where(and(eq(invite.id, id), eq(invite.gymId, gymId)));
	},
	setRole: async (event) => {
		const { gymId } = owner(event);
		const form = await event.request.formData();
		const id = str(form, 'id');
		const role = str(form, 'role');
		if (role !== 'owner' && role !== 'coach') return fail(400, { message: 'Invalid role' });
		const [m] = await db
			.select()
			.from(member)
			.where(and(eq(member.id, id), eq(member.gymId, gymId)));
		if (!m || m.role === 'student') return fail(404, { message: 'Member not found' });
		if (m.role === 'owner' && role === 'coach' && (await ownerCount(gymId)) <= 1)
			return fail(400, { message: 'A gym needs at least one owner.' });
		await db.update(member).set({ role }).where(eq(member.id, id));
	},
	remove: async (event) => {
		const { gymId } = owner(event);
		const id = str(await event.request.formData(), 'id');
		const [m] = await db
			.select()
			.from(member)
			.where(and(eq(member.id, id), eq(member.gymId, gymId)));
		if (!m) return fail(404, { message: 'Member not found' });
		if (m.role === 'owner' && (await ownerCount(gymId)) <= 1)
			return fail(400, { message: 'A gym needs at least one owner.' });
		if (m.role === 'student') {
			await db
				.update(athlete)
				.set({ userId: null })
				.where(and(eq(athlete.gymId, gymId), eq(athlete.userId, m.userId)));
		}
		await db.delete(member).where(eq(member.id, id));
	}
};
