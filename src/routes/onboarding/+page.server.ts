import { fail, redirect } from '@sveltejs/kit';
import { createGym } from '$lib/server/gyms';
import { str } from '$lib/server/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/login?next=/onboarding');
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/login');
		const form = await request.formData();
		const name = str(form, 'name');
		if (!name) return fail(400, { message: 'Please give your gym a name' });
		const g = await createGym({
			name,
			ownerUserId: locals.user.id,
			withTemplate: form.get('template') === 'on'
		});
		redirect(303, `/g/${g.id}`);
	},
	join: async ({ request }) => {
		const form = await request.formData();
		const raw = str(form, 'invite');
		const tok = raw.split('/invite/').pop()?.split(/[?#]/)[0] ?? '';
		if (!tok) return fail(400, { joinMessage: 'Paste the invite link you were sent' });
		redirect(303, `/invite/${encodeURIComponent(tok)}`);
	}
};
