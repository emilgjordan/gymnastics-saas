import { redirect } from '@sveltejs/kit';
import { safeNext } from '$lib/server/util';
import { signInSocial, signUpEmail } from '$lib/server/authActions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next')));
};

export const actions: Actions = { email: signUpEmail, github: signInSocial };
