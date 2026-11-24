<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import FormError from './FormError.svelte';

	let {
		mode,
		form,
		githubEnabled
	}: {
		mode: 'login' | 'signup';
		form: { message?: string; email?: string; name?: string } | null;
		githubEnabled: boolean;
	} = $props();

	let loading = $state(false);
	const qs = $derived(page.url.search);
	const extra = $derived(qs ? '&' + qs.slice(1) : '');
	const other = $derived(mode === 'login' ? `/signup${qs}` : `/login${qs}`);
</script>

<h1 class="text-xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
<p class="mt-1 muted">
	{mode === 'login' ? 'Sign in to continue.' : 'Coaches, owners and athletes all start here.'}
</p>

<form
	method="POST"
	action="?/email{extra}"
	class="mt-6 space-y-4"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			await update({ reset: false });
			loading = false;
		};
	}}
>
	<FormError message={form?.message} />
	{#if mode === 'signup'}
		<div>
			<label class="label" for="name">Full name</label>
			<input
				class="input"
				id="name"
				name="name"
				required
				defaultValue={form?.name ?? ''}
				autocomplete="name"
			/>
		</div>
	{/if}
	<div>
		<label class="label" for="email">Email</label>
		<input
			class="input"
			id="email"
			name="email"
			type="email"
			required
			defaultValue={form?.email ?? ''}
			autocomplete="email"
		/>
	</div>
	<div>
		<label class="label" for="password">Password</label>
		<input
			class="input"
			id="password"
			name="password"
			type="password"
			required
			minlength={mode === 'signup' ? 8 : undefined}
			autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
		/>
	</div>
	<button class="btn-primary w-full" disabled={loading}>
		{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
	</button>
</form>

{#if githubEnabled}
	<div class="my-5 flex items-center gap-3 text-xs text-slate-400">
		<div class="h-px flex-1 bg-slate-200"></div>
		or
		<div class="h-px flex-1 bg-slate-200"></div>
	</div>
	<form method="POST" action="?/github{extra}">
		<button class="btn-secondary w-full">Continue with GitHub</button>
	</form>
{/if}

<p class="mt-6 text-center text-sm text-slate-600">
	{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
	<a href={other} class="font-medium text-indigo-600 hover:text-indigo-500">
		{mode === 'login' ? 'Sign up' : 'Sign in'}
	</a>
</p>
