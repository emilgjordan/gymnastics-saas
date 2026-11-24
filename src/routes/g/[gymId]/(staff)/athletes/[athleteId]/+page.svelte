<script lang="ts">
	import { enhance } from '$app/forms';
	import SkillBoard from '$lib/components/SkillBoard.svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import FormError from '$lib/components/FormError.svelte';

	let { data, form } = $props();
	const base = $derived(`/g/${data.gym.id}`);
	const c = $derived(data.curriculum);
	const levelName = $derived(c.levels.find((l) => l.id === data.athlete.levelId)?.name);
	const teamName = $derived(data.teams.find((t) => t.id === data.athlete.teamId)?.name);
	let editing = $state(false);
	let copied = $state(false);

	async function copy(text: string) {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head><title>{data.athlete.name} · {data.gym.name}</title></svelte:head>

<a href="{base}/athletes" class="text-sm text-slate-500 hover:text-slate-700">← Athletes</a>

<div class="mt-2 flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="page-title">{data.athlete.name}</h1>
		<p class="mt-1 muted">
			{#if data.athlete.teamId}<a
					class="hover:text-indigo-600"
					href="{base}/teams/{data.athlete.teamId}">{teamName}</a
				>{:else}No team{/if}
			· {levelName ?? 'No level'}
			{#if data.athlete.birthYear}· Born {data.athlete.birthYear}{/if}
		</p>
	</div>
	<button class="btn-secondary" onclick={() => (editing = !editing)}
		>{editing ? 'Close' : 'Edit details'}</button
	>
</div>

<FormError message={form?.message} />

{#if editing}
	<form
		method="POST"
		action="?/update"
		class="mt-4 grid gap-4 card p-5 sm:grid-cols-2"
		use:enhance={() =>
			async ({ result, update }) => {
				await update({ reset: false });
				if (result.type === 'success') editing = false;
			}}
	>
		<div>
			<label class="label" for="name">Name</label>
			<input class="input" id="name" name="name" value={data.athlete.name} required />
		</div>
		<div>
			<label class="label" for="birthYear">Birth year</label>
			<input
				class="input"
				id="birthYear"
				name="birthYear"
				type="number"
				value={data.athlete.birthYear ?? ''}
			/>
		</div>
		<div>
			<label class="label" for="teamId">Team</label>
			<select class="input" id="teamId" name="teamId" value={data.athlete.teamId ?? ''}>
				<option value="">No team</option>
				{#each data.teams as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
			</select>
		</div>
		<div>
			<label class="label" for="levelId">Level</label>
			<select class="input" id="levelId" name="levelId" value={data.athlete.levelId ?? ''}>
				<option value="">No level</option>
				{#each c.levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
			</select>
		</div>
		<div class="sm:col-span-2">
			<label class="label" for="notes">Coach notes</label>
			<textarea class="input" id="notes" name="notes" rows="3">{data.athlete.notes ?? ''}</textarea>
		</div>
		<div class="flex justify-between sm:col-span-2">
			<button
				class="btn-danger"
				formaction="?/delete"
				onclick={(e) => {
					if (!confirm(`Delete ${data.athlete.name} and all their progress? This can't be undone.`))
						e.preventDefault();
				}}>Delete athlete</button
			>
			<button class="btn-primary">Save</button>
		</div>
	</form>
{/if}

{#if form?.movedTo}
	<p class="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
		🎉 Moved up to {form.movedTo}!
	</p>
{/if}

<div class="mt-6 grid gap-4 lg:grid-cols-3">
	<div class="card p-5 lg:col-span-2">
		{#if data.athlete.levelId}
			<div class="flex items-baseline justify-between">
				<p class="text-xs font-medium text-slate-500">Progress in {levelName}</p>
				<p class="text-xs text-slate-500">
					{data.current.mastered} mastered · {data.current.working} working on · {data.current
						.total} skills
				</p>
			</div>
			<p class="mt-1 text-3xl font-semibold">{data.current.percent}%</p>
			<div class="mt-3">
				<ProgressBar
					mastered={data.current.mastered}
					working={data.current.working}
					total={data.current.total}
				/>
			</div>
			{#if data.current.complete && data.nextLevel}
				<form
					method="POST"
					action="?/moveUp"
					use:enhance
					class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200 ring-inset"
				>
					<p class="text-sm text-emerald-800">
						<span class="font-semibold">Ready to move up!</span> Every {levelName} skill is mastered.
					</p>
					<button class="btn-primary bg-emerald-600 hover:bg-emerald-500"
						>Move to {data.nextLevel.name}</button
					>
				</form>
			{:else if data.current.complete}
				<p class="mt-4 text-sm text-emerald-700">All skills in the top level are mastered. 🏆</p>
			{/if}
		{:else}
			<p class="text-sm text-slate-600">
				This athlete has no level yet. <button
					class="text-indigo-600 hover:underline"
					onclick={() => (editing = true)}>Assign one</button
				> to track level progress.
			</p>
		{/if}
	</div>

	<div class="card p-5">
		<p class="text-xs font-medium text-slate-500">Athlete login</p>
		{#if data.login}
			<p class="mt-2 text-sm">Linked to <span class="font-medium">{data.login.email}</span></p>
			<form method="POST" action="?/unlink" use:enhance class="mt-3">
				<button
					class="btn-ghost btn-sm text-red-600"
					onclick={(e) => {
						if (!confirm('Remove this login from the athlete?')) e.preventDefault();
					}}>Unlink login</button
				>
			</form>
		{:else if data.inviteUrl}
			<p class="mt-2 text-sm text-slate-600">
				Share this link with {data.athlete.name.split(' ')[0]} (or their parent) so they can log in and
				see their progress:
			</p>
			<div class="mt-2 flex gap-2">
				<input
					class="input py-1 text-xs"
					readonly
					value={data.inviteUrl}
					onfocus={(e) => e.currentTarget.select()}
				/>
				<button class="btn-secondary btn-sm" onclick={() => copy(data.inviteUrl!)}
					>{copied ? 'Copied!' : 'Copy'}</button
				>
			</div>
			<form method="POST" action="?/invite" use:enhance class="mt-2">
				<button class="text-xs text-slate-500 hover:underline">Generate a new link</button>
			</form>
		{:else}
			<p class="mt-2 text-sm text-slate-600">
				Let this athlete log in to follow their own progress.
			</p>
			<form method="POST" action="?/invite" use:enhance class="mt-3">
				<button class="btn-secondary btn-sm">Create invite link</button>
			</form>
		{/if}
	</div>
</div>

{#if data.athlete.notes && !editing}
	<div class="mt-4 card p-4 text-sm text-slate-700">
		<span class="text-xs font-medium text-slate-500">Coach notes · </span>{data.athlete.notes}
	</div>
{/if}

<h2 class="mt-8 mb-3 font-semibold">Skills</h2>
{#key data.athlete.id}
	<SkillBoard
		levels={c.levels}
		events={c.events}
		skills={c.skills}
		statuses={data.statuses}
		currentLevelId={data.athlete.levelId}
		editable
	/>
{/key}

<section class="mt-8 card">
	<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">History</h2>
	<ActivityList items={data.activity} showAthlete={false} />
</section>
