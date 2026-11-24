import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { gym } from '$lib/server/db/schema';
import { owner } from '$lib/server/guards';
import { str } from '$lib/server/util';
import type { Actions } from './$types';

export const actions: Actions = {
	rename: async (event) => {
		const { gymId } = owner(event);
		const name = str(await event.request.formData(), 'name');
		if (!name) return fail(400, { message: 'Name is required' });
		await db.update(gym).set({ name }).where(eq(gym.id, gymId));
		return { saved: true };
	},
	delete: async (event) => {
		const { gymId } = owner(event);
		const confirmName = str(await event.request.formData(), 'confirm');
		if (confirmName !== event.locals.gym!.name)
			return fail(400, { deleteMessage: 'Type the gym name exactly to confirm.' });
		await db.delete(gym).where(eq(gym.id, gymId));
		redirect(303, '/app');
	}
};
