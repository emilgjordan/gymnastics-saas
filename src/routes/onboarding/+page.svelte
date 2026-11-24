<script lang="ts">
	import { enhance } from '$app/forms';
	import Logo from '$lib/components/Logo.svelte';
	import FormError from '$lib/components/FormError.svelte';
	let { data, form } = $props();
</script>

<svelte:head><title>Get started</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12">
	<div class="mb-10 flex items-center justify-between">
		<Logo href="/app" />
		<form method="POST" action="/logout"><button class="btn-ghost btn-sm">Sign out</button></form>
	</div>
	<h1 class="page-title">Welcome, {data.user?.name}!</h1>
	<p class="mt-1 muted">Set up a new gym, or join one you've been invited to.</p>

	<div class="mt-8 grid gap-6 md:grid-cols-2">
		<form method="POST" action="?/create" use:enhance class="space-y-4 card p-6">
			<h2 class="font-semibold">Create a gym</h2>
			<p class="muted">
				For gym owners and head coaches. You can invite your coaches and athletes next.
			</p>
			<FormError message={form?.message} />
			<div>
				<label class="label" for="name">Gym name</label>
				<input
					class="input"
					id="name"
					name="name"
					placeholder="e.g. Riverside Gymnastics"
					required
				/>
			</div>
			<label class="flex items-start gap-2 text-sm text-slate-700">
				<input
					type="checkbox"
					name="template"
					checked
					class="mt-0.5 rounded border-slate-300 text-indigo-600"
				/>
				<span
					>Start with the starter curriculum (Levels 1–5 across floor, beam, bars and vault). You
					can edit it any time.</span
				>
			</label>
			<button class="btn-primary w-full">Create gym</button>
		</form>

		<form method="POST" action="?/join" class="space-y-4 card p-6">
			<h2 class="font-semibold">Join with an invite</h2>
			<p class="muted">Coaches and athletes: paste the invite link your gym sent you.</p>
			<FormError message={form?.joinMessage} />
			<div>
				<label class="label" for="invite">Invite link</label>
				<input class="input" id="invite" name="invite" placeholder="https://…/invite/…" required />
			</div>
			<button class="btn-secondary w-full">Continue</button>
		</form>
	</div>
</div>
