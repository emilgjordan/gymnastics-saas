import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { athlete, gym, invite, member } from '$lib/server/db/schema';
import { findOpenInvite } from '$lib/server/invites';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const inv = await findOpenInvite(params.token);
	if (!inv) error(404, 'This invite link is invalid, expired or has already been used.');

	const [g] = await db.select({ name: gym.name }).from(gym).where(eq(gym.id, inv.gymId));
	let athleteName: string | null = null;
	if (inv.athleteId) {
		const [a] = await db
			.select({ name: athlete.name })
			.from(athlete)
			.where(eq(athlete.id, inv.athleteId));
		athleteName = a?.name ?? null;
	}

	let existingRole: string | null = null;
	if (locals.user) {
		const [m] = await db
			.select({ role: member.role })
			.from(member)
			.where(and(eq(member.gymId, inv.gymId), eq(member.userId, locals.user.id)));
		existingRole = m?.role ?? null;
	}

	return { gymName: g.name, role: inv.role, athleteName, existingRole, gymId: inv.gymId };
};

export const actions: Actions = {
	accept: async ({ params, locals }) => {
		if (!locals.user) redirect(303, `/signup?next=/invite/${params.token}`);
		const user = locals.user;
		const inv = await findOpenInvite(params.token);
		if (!inv) return fail(400, { message: 'This invite is no longer valid.' });

		const result = await db.transaction(async (tx) => {
			const [existing] = await tx
				.select()
				.from(member)
				.where(and(eq(member.gymId, inv.gymId), eq(member.userId, user.id)));

			if (inv.role === 'student') {
				if (existing && existing.role !== 'student') {
					return {
						error:
							'You are already staff at this gym. Sign in with a different account to accept an athlete invite.'
					};
				}
				if (inv.athleteId) {
					const [a] = await tx
						.update(athlete)
						.set({ userId: user.id })
						.where(and(eq(athlete.id, inv.athleteId), isNull(athlete.userId)))
						.returning({ id: athlete.id });
					if (!a) return { error: 'This athlete profile is already linked to another login.' };
				}
				if (!existing)
					await tx.insert(member).values({ gymId: inv.gymId, userId: user.id, role: 'student' });
			} else {
				if (existing?.role === 'owner') {
					// already the highest role; nothing to do
				} else if (existing) {
					await tx.update(member).set({ role: inv.role }).where(eq(member.id, existing.id));
				} else {
					await tx.insert(member).values({ gymId: inv.gymId, userId: user.id, role: inv.role });
				}
			}

			await tx
				.update(invite)
				.set({ usedAt: new Date(), usedBy: user.id })
				.where(eq(invite.id, inv.id));
			return { ok: true as const };
		});

		if ('error' in result) return fail(400, { message: result.error });
		redirect(303, `/g/${inv.gymId}`);
	}
};
