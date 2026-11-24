import { error, type RequestEvent } from '@sveltejs/kit';

export function staff(event: RequestEvent) {
	const m = event.locals.membership;
	if (!m || m.role === 'student') error(403, 'Coaches only');
	return {
		gymId: event.locals.gym!.id,
		userId: event.locals.user!.id,
		memberId: m.id,
		role: m.role
	};
}

export function owner(event: RequestEvent) {
	const s = staff(event);
	if (s.role !== 'owner') error(403, 'Owners only');
	return s;
}
