import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { gym, member } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const gyms = await db
		.select({ id: gym.id, name: gym.name, role: member.role })
		.from(member)
		.innerJoin(gym, eq(gym.id, member.gymId))
		.where(eq(member.userId, locals.user.id))
		.orderBy(gym.name);

	if (gyms.length === 0) redirect(303, '/onboarding');
	if (gyms.length === 1) redirect(303, `/g/${gyms[0].id}`);
	return { gyms };
};
