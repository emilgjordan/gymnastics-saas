import type { LayoutServerLoad } from './$types';

// Access is enforced in hooks.server.ts; locals.gym/membership are guaranteed here.
export const load: LayoutServerLoad = ({ locals }) => ({
	gym: locals.gym!,
	role: locals.membership!.role
});
