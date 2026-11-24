<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import FormError from '$lib/components/FormError.svelte';
	let { data, form } = $props();
	const next = $derived(encodeURIComponent(page.url.pathname));
	const roleText = $derived(
		data.role === 'student'
			? data.athleteName
				? `as ${data.athleteName}`
				: 'as an athlete'
			: data.role === 'owner'
				? 'as an owner'
				: 'as a coach'
	);
</script>

<svelte:head><title>Join {data.gymName}</title></svelte:head>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4"
>
	<div class="mb-8"><Logo /></div>
	<div class="w-full max-w-md card p-8 text-center">
		<p class="muted">You've been invited to join</p>
		<h1 class="mt-1 text-2xl font-semibold">{data.gymName}</h1>
		<p class="mt-1 text-slate-600">{roleText}</p>

		<div class="mt-6 space-y-3 text-left">
			<FormError message={form?.message} />
			{#if !data.user}
				<a href="/signup?next={next}" class="btn-primary w-full">Create an account to accept</a>
				<a href="/login?next={next}" class="btn-secondary w-full">I already have an account</a>
			{:else if data.existingRole && (data.role === 'student' ? data.existingRole === 'student' && !data.athleteName : data.existingRole === 'owner' || data.existingRole === data.role)}
				<p class="text-center text-sm text-slate-600">You're already a member of this gym.</p>
				<a href="/g/{data.gymId}" class="btn-primary w-full">Go to gym</a>
			{:else}
				<form method="POST" action="?/accept">
					<button class="btn-primary w-full">Accept invite as {data.user.name}</button>
				</form>
				<form method="POST" action="/logout" class="text-center text-xs text-slate-500">
					Not you? <button class="underline">Sign out</button>
				</form>
			{/if}
		</div>
	</div>
</div>
