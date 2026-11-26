<script lang="ts">
	import { enhance } from '$app/forms';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import Empty from '$lib/components/Empty.svelte';
	import Streamed from '$lib/components/Streamed.svelte';
	import Bone from '$lib/components/skeletons/Bone.svelte';
	import { submit } from '$lib/forms';
	let { data, form } = $props();
	let showAdd = $state(false);
	const base = $derived(`/g/${data.gym.id}`);
</script>

<svelte:head><title>Teams · {data.gym.name}</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="page-title">Teams</h1>
		<p class="mt-1 muted">
			Group athletes by program, gender or level — e.g. “Girls Level 3” or “Boys Rec”.
		</p>
	</div>
	<button class="btn-primary" onclick={() => (showAdd = !showAdd)}
		>{showAdd ? 'Close' : 'New team'}</button
	>
</div>

{#if showAdd}
	<form
		method="POST"
		action="?/create"
		use:enhance={submit({ reset: false })}
		class="mt-6 grid gap-4 card p-5 sm:grid-cols-2"
	>
		<div class="sm:col-span-2"><FormError message={form?.message} /></div>
		<div>
			<label class="label" for="name">Team name</label>
			<input class="input" id="name" name="name" required placeholder="Girls Level 3" />
		</div>
		<div>
			<label class="label" for="description"
				>Description <span class="font-normal text-slate-400">(optional)</span></label
			>
			<input class="input" id="description" name="description" placeholder="Tue/Thu 4–6pm" />
		</div>
		<label class="flex items-center gap-2 text-sm text-slate-700">
			<input
				type="checkbox"
				name="assignMe"
				checked
				class="rounded border-slate-300 text-indigo-600"
			/> I coach this team
		</label>
		<div class="flex justify-end"><button class="btn-primary">Create team</button></div>
	</form>
{/if}

<div class="mt-6">
	<Streamed promise={data.teams}>
		{#snippet skeleton()}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each { length: 6 }, i (i)}
					<div class="space-y-2 card p-5">
						<Bone class="h-5 w-32" />
						<Bone class="h-3.5 w-24" />
						<div class="pt-3"><Bone class="h-3.5 w-40" /></div>
						<Bone class="h-3 w-28" />
						<div class="pt-3"><Bone class="h-1.5 w-full" /></div>
					</div>
				{/each}
			</div>
		{/snippet}
		{#snippet children(teams)}
			{#if teams.length === 0}
				<Empty title="No teams yet">Create a team to group athletes and assign coaches.</Empty>
			{:else}
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each teams as t (t.id)}
						<a href="{base}/teams/{t.id}" class="block card p-5 hover:border-indigo-300">
							<h2 class="font-semibold">{t.name}</h2>
							{#if t.description}<p class="muted">{t.description}</p>{/if}
							<p class="mt-3 text-sm text-slate-600">
								{t.athleteCount} athletes{t.ready ? ` · ${t.ready} ready to move up` : ''}
							</p>
							<p class="text-xs text-slate-500">
								{t.coaches.length ? `Coaches: ${t.coaches.join(', ')}` : 'No coach assigned'}
							</p>
							<div class="mt-4"><ProgressBar size="sm" mastered={t.avg} total={100} /></div>
							<p class="mt-1 text-xs text-slate-500">Avg. {t.avg}% through current level</p>
						</a>
					{/each}
				</div>
			{/if}
		{/snippet}
	</Streamed>
</div>
