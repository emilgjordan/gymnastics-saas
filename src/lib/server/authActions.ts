import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from './auth';
import { safeNext, str } from './util';

export async function signInSocial(event: RequestEvent) {
	const next = safeNext(event.url.searchParams.get('next'));
	const result = await auth.api.signInSocial({ body: { provider: 'github', callbackURL: next } });
	if (result.url) redirect(303, result.url);
	return fail(400, { message: 'GitHub sign-in failed' });
}

export async function signInEmail(event: RequestEvent) {
	const form = await event.request.formData();
	const email = str(form, 'email');
	try {
		await auth.api.signInEmail({
			body: { email, password: form.get('password')?.toString() ?? '' }
		});
	} catch (e) {
		if (e instanceof APIError) return fail(400, { email, message: 'Invalid email or password' });
		throw e;
	}
	redirect(303, safeNext(event.url.searchParams.get('next')));
}

export async function signUpEmail(event: RequestEvent) {
	const form = await event.request.formData();
	const email = str(form, 'email');
	const name = str(form, 'name');
	const password = form.get('password')?.toString() ?? '';
	if (!name) return fail(400, { email, name, message: 'Please enter your name' });
	if (password.length < 8)
		return fail(400, { email, name, message: 'Password must be at least 8 characters' });
	try {
		await auth.api.signUpEmail({ body: { email, password, name } });
	} catch (e) {
		if (e instanceof APIError)
			return fail(400, { email, name, message: e.message || 'Sign up failed' });
		throw e;
	}
	redirect(303, safeNext(event.url.searchParams.get('next')));
}
