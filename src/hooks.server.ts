import { error, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { gym, member } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

/**
 * Central access control for everything under /g/[gymId].
 * - must be signed in and a member of the gym
 * - routes inside a `(staff)` group require owner or coach
 * - routes inside an `(owner)` group require owner
 * Runs before both load functions and form actions.
 */
const handleGymAccess: Handle = async ({ event, resolve }) => {
	const gymId = event.params.gymId;
	if (!gymId || !event.route.id?.startsWith('/g/[gymId]')) return resolve(event);

	if (!event.locals.user) {
		redirect(303, `/login?next=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}

	const [row] = await db
		.select({ gymId: gym.id, gymName: gym.name, memberId: member.id, role: member.role })
		.from(member)
		.innerJoin(gym, eq(gym.id, member.gymId))
		.where(and(eq(member.gymId, gymId), eq(member.userId, event.locals.user.id)))
		.limit(1);

	if (!row) error(404, 'Gym not found');

	event.locals.gym = { id: row.gymId, name: row.gymName };
	event.locals.membership = { id: row.memberId, role: row.role };

	const routeId = event.route.id;
	if (routeId.includes('/(staff)') && row.role === 'student') {
		redirect(303, `/g/${gymId}/me`);
	}
	if (routeId.includes('/(owner)') && row.role !== 'owner') {
		error(403, 'Only gym owners can access this page');
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleBetterAuth, handleGymAccess);
