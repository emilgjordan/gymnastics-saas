<script lang="ts">
	import { enhance } from '$app/forms';
	import FormError from '$lib/components/FormError.svelte';
	let { data, form } = $props();
	let copiedId = $state<string | null>(null);
	const base = $derived(`/g/${data.gym.id}`);

	async function copy(id: string, text: string) {
		await navigator.clipboard.writeText(text);
		copiedId = id;
		setTimeout(() => (copiedId = null), 2000);
	}
	const confirmIt = (msg: string) => (e: Event) => {
		if (!confirm(msg)) e.preventDefault();
	};
</script>

<svelte:head><title>Coaches & staff · {data.gym.name}</title></svelte:head>

<h1 class="page-title">Coaches & staff</h1>
<p class="mt-1 muted">
	Owners can manage everything. Coaches can manage athletes, teams and skill progress.
</p>

<div class="mt-4"><FormError message={form?.message} /></div>

<section class="mt-6 card">
	<div
		class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3"
	>
		<h2 class="font-semibold">Invite a coach</h2>
		<form method="POST" action="?/invite" use:enhance class="flex gap-2">
			<select name="role" class="input w-auto py-1.5">
				<option value="coach">as Coach</option>
				<option value="owner">as Owner</option>
			</select>
			<button class="btn-primary btn-sm">Create invite link</button>
		</form>
	</div>
	{#if data.invites.length}
		<ul class="divide-y divide-slate-100">
			{#each data.invites as i (i.id)}
				<li class="flex flex-wrap items-center gap-2 px-4 py-2.5">
					<span class="w-14 text-xs font-medium text-slate-500 capitalize">{i.role}</span>
					<input
						class="input min-w-0 flex-1 py-1 text-xs"
						readonly
						value={i.url}
						onfocus={(e) => e.currentTarget.select()}
					/>
					<button class="btn-secondary btn-sm" onclick={() => copy(i.id, i.url)}
						>{copiedId === i.id ? 'Copied!' : 'Copy'}</button
					>
					<span class="text-xs text-slate-400"
						>expires {new Date(i.expiresAt).toLocaleDateString()}</span
					>
					<form method="POST" action="?/revoke" use:enhance>
						<input type="hidden" name="id" value={i.id} />
						<button class="text-xs text-slate-400 hover:text-red-600">Revoke</button>
					</form>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="px-4 py-4 muted">
			Create a link and send it to a coach. Each link works once and expires after 7 days.
		</p>
	{/if}
</section>

<section class="mt-6 card">
	<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">Staff ({data.staff.length})</h2>
	<ul class="divide-y divide-slate-100">
		{#each data.staff as m (m.id)}
			<li class="flex flex-wrap items-center gap-3 px-4 py-3">
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium">
						{m.name}
						{#if m.userId === data.user?.id}<span class="text-xs text-slate-400">(you)</span>{/if}
					</p>
					<p class="text-xs text-slate-500">{m.email}</p>
				</div>
				<form method="POST" action="?/setRole" use:enhance>
					<input type="hidden" name="id" value={m.id} />
					<select
						name="role"
						class="input w-auto py-1 text-xs"
						value={m.role}
						onchange={(e) => e.currentTarget.form?.requestSubmit()}
					>
						<option value="owner">Owner</option>
						<option value="coach">Coach</option>
					</select>
				</form>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={m.id} />
					<button
						class="text-xs text-slate-400 hover:text-red-600"
						onclick={confirmIt(`Remove ${m.name} from ${data.gym.name}?`)}>Remove</button
					>
				</form>
			</li>
		{/each}
	</ul>
</section>

<section class="mt-6 card">
	<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">
		Athlete logins ({data.students.length})
	</h2>
	{#if data.students.length}
		<ul class="divide-y divide-slate-100">
			{#each data.students as m (m.id)}
				<li class="flex flex-wrap items-center gap-3 px-4 py-3">
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium">{m.name}</p>
						<p class="text-xs text-slate-500">
							{m.email} ·
							{#each m.athletes as a, i (a.id)}{i ? ', ' : ''}<a
									class="text-indigo-600 hover:underline"
									href="{base}/athletes/{a.id}">{a.name}</a
								>{:else}no athlete linked{/each}
						</p>
					</div>
					<form method="POST" action="?/remove" use:enhance>
						<input type="hidden" name="id" value={m.id} />
						<button
							class="text-xs text-slate-400 hover:text-red-600"
							onclick={confirmIt(`Remove ${m.name}'s access? Their athlete progress is kept.`)}
							>Remove access</button
						>
					</form>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="px-4 py-4 muted">Invite athletes from their profile page on the Athletes tab.</p>
	{/if}
</section>
