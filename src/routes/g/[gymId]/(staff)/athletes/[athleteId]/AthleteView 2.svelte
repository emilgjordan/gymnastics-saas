<script lang="ts">
	import { enhance } from '$app/forms';
	import SkillBoard from '$lib/components/SkillBoard.svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { submit } from '$lib/forms';
	import { createOptimistic } from '$lib/optimistic.svelte';
	import { summarize, type SkillStatus } from '$lib/progress';
	import type { PageData } from './$types';

	let {
		v,
		athlete,
		editing = $bindable()
	}: {
		v: Awaited<PageData['view']>;
		athlete: PageData['athlete'];
		editing: boolean;
	} = $props();
	const c = $derived(v.curriculum);
	const levelName = $derived(athlete.levelName);
	let copied = $state(false);

	// Status clicks show instantly (incl. the progress card); the server catches up in the background.
	const opt = createOptimistic<SkillStatus>(() => v.statuses);
	const statuses = $derived.by(() => {
		const entries = Object.entries(opt.overrides);
		if (!entries.length) return v.statuses;
		const out = { ...v.statuses };
		for (const [id, status] of entries) {
			const prev = out[id];
			out[id] = {
				status,
				note: prev?.note ?? null,
				masteredAt:
					status === 'mastered'
						? prev?.status === 'mastered'
							? prev.masteredAt
							: new Date()
						: null
			};
		}
		return out;
	});
	const current = $derived(
		summarize(
			c.skills
				.filter((s) => s.levelId === athlete.levelId)
				.map((s) => statuses[s.id]?.status ?? 'not_started')
		)
	);

	async function copy(text: string) {
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

{#if editing}
	<form
		method="POST"
		action="?/update"
		class="mt-4 grid gap-4 card p-5 sm:grid-cols-2"
		use:enhance={submit({ reset: false, success: 'Saved', onSuccess: () => (editing = false) })}
	>
		<div>
			<label class="label" for="name">Name</label>
			<input class="input" id="name" name="name" value={athlete.name} required />
		</div>
		<div>
			<label class="label" for="birthYear">Birth year</label>
			<input
				class="input"
				id="birthYear"
				name="birthYear"
				type="number"
				value={athlete.birthYear ?? ''}
			/>
		</div>
		<div>
			<label class="label" for="teamId">Team</label>
			<select class="input" id="teamId" name="teamId" value={athlete.teamId ?? ''}>
				<option value="">No team</option>
				{#each v.teams as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
			</select>
		</div>
		<div>
			<label class="label" for="levelId">Level</label>
			<select class="input" id="levelId" name="levelId" value={athlete.levelId ?? ''}>
				<option value="">No level</option>
				{#each c.levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
			</select>
		</div>
		<div class="sm:col-span-2">
			<label class="label" for="notes">Coach notes</label>
			<textarea class="input" id="notes" name="notes" rows="3">{athlete.notes ?? ''}</textarea>
		</div>
		<div class="flex justify-between sm:col-span-2">
			<button
				class="btn-danger"
				formaction="?/delete"
				onclick={(e) => {
					if (!confirm(`Delete ${athlete.name} and all their progress? This can't be undone.`))
						e.preventDefault();
				}}>Delete athlete</button
			>
			<button class="btn-primary">Save</button>
		</div>
	</form>
{/if}

<div class="mt-6 grid gap-4 lg:grid-cols-3">
	<div class="card p-5 lg:col-span-2">
		{#if athlete.levelId}
			<div class="flex items-baseline justify-between">
				<p class="text-xs font-medium text-slate-500">Progress in {levelName}</p>
				<p class="text-xs text-slate-500">
					{current.mastered} mastered · {current.working} working on · {current.total} skills
				</p>
			</div>
			<p class="mt-1 text-3xl font-semibold">{current.percent}%</p>
			<div class="mt-3">
				<ProgressBar mastered={current.mastered} working={current.working} total={current.total} />
			</div>
			{#if current.complete && v.nextLevel}
				<form
					method="POST"
					action="?/moveUp"
					use:enhance={submit({
						success: (r) => `🎉 Moved up to ${r.type === 'success' ? r.data?.movedTo : ''}!`
					})}
					class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200 ring-inset"
				>
					<p class="text-sm text-emerald-800">
						<span class="font-semibold">Ready to move up!</span> Every {levelName} skill is mastered.
					</p>
					<button class="btn-primary bg-emerald-600 hover:bg-emerald-500"
						>Move to {v.nextLevel.name}</button
					>
				</form>
			{:else if current.complete}
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
		{#if v.login}
			<p class="mt-2 text-sm">Linked to <span class="font-medium">{v.login.email}</span></p>
			<form
				method="POST"
				action="?/unlink"
				use:enhance={submit({ success: 'Login unlinked' })}
				class="mt-3"
			>
				<button
					class="btn-ghost btn-sm text-red-600"
					onclick={(e) => {
						if (!confirm('Remove this login from the athlete?')) e.preventDefault();
					}}>Unlink login</button
				>
			</form>
		{:else if v.inviteUrl}
			<p class="mt-2 text-sm text-slate-600">
				Share this link with {athlete.name.split(' ')[0]} (or their parent) so they can log in and see
				their progress:
			</p>
			<div class="mt-2 flex gap-2">
				<input
					class="input py-1 text-xs"
					readonly
					value={v.inviteUrl}
					onfocus={(e) => e.currentTarget.select()}
				/>
				<button class="btn-secondary btn-sm" onclick={() => copy(v.inviteUrl!)}
					>{copied ? 'Copied!' : 'Copy'}</button
				>
			</div>
			<form
				method="POST"
				action="?/invite"
				use:enhance={submit({ success: 'New link created' })}
				class="mt-2"
			>
				<button class="text-xs text-slate-500 hover:underline">Generate a new link</button>
			</form>
		{:else}
			<p class="mt-2 text-sm text-slate-600">
				Let this athlete log in to follow their own progress.
			</p>
			<form
				method="POST"
				action="?/invite"
				use:enhance={submit({ success: 'Invite link created' })}
				class="mt-3"
			>
				<button class="btn-secondary btn-sm">Create invite link</button>
			</form>
		{/if}
	</div>
</div>

{#if athlete.notes && !editing}
	<div class="mt-4 card p-4 text-sm text-slate-700">
		<span class="text-xs font-medium text-slate-500">Coach notes · </span>{athlete.notes}
	</div>
{/if}

<h2 class="mt-8 mb-3 font-semibold">Skills</h2>
<SkillBoard
	levels={c.levels}
	events={c.events}
	skills={c.skills}
	{statuses}
	currentLevelId={athlete.levelId}
	editable
	onStatus={(skillId) => opt.enhance(skillId, (fd) => String(fd.get('status')) as SkillStatus)}
/>

<section class="mt-8 card">
	<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">History</h2>
	<ActivityList items={v.activity} showAthlete={false} />
</section>
