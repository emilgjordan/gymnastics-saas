<script lang="ts">
	import { enhance } from '$app/forms';
	import Empty from '$lib/components/Empty.svelte';
	import { submit } from '$lib/forms';
	import { createOptimistic } from '$lib/optimistic.svelte';
	import type { Curriculum } from '$lib/server/athletes';

	let {
		curriculum,
		canEdit,
		tab = $bindable()
	}: { curriculum: Curriculum; canEdit: boolean; tab: 'skills' | 'structure' } = $props();

	// svelte-ignore state_referenced_locally
	let selectedLevel = $state(curriculum.levels[0]?.id ?? '');
	let editingId = $state<string | null>(null);

	// Optimistic ordering: group key -> ids in display order
	const order = createOptimistic<string[]>(() => curriculum);
	const ordered = <T extends { id: string }>(key: string, items: T[]) => {
		const ids = order.get(key);
		if (!ids) return items;
		const byId = new Map(items.map((i) => [i.id, i]));
		return ids.map((id) => byId.get(id)).filter((i) => i !== undefined);
	};
	const moveIn = (key: string, ids: string[], id: string) =>
		order.enhance(key, (fd) => {
			const next = [...ids];
			const i = next.indexOf(id);
			const j = fd.get('dir') === 'up' ? i - 1 : i + 1;
			if (i >= 0 && j >= 0 && j < next.length) [next[i], next[j]] = [next[j], next[i]];
			return next;
		});

	const levels = $derived(ordered('level', curriculum.levels));
	const events = $derived(ordered('event', curriculum.events));

	$effect(() => {
		if (!levels.some((l) => l.id === selectedLevel)) selectedLevel = levels[0]?.id ?? '';
	});

	// One pass over all skills instead of filtering per event on every render.
	const byLevelEvent = $derived.by(() => {
		const m: Record<string, Curriculum['skills']> = {};
		for (const s of curriculum.skills) (m[`${s.levelId}:${s.apparatusId}`] ??= []).push(s);
		return m;
	});
	const countByLevel = $derived.by(() => {
		const m: Record<string, number> = {};
		for (const s of curriculum.skills) m[s.levelId] = (m[s.levelId] ?? 0) + 1;
		return m;
	});

	const keep = (msg: string) =>
		submit({
			success: msg,
			onSuccess: () => (editingId = null)
		});
	const confirmDel = (what: string) => (e: Event) => {
		if (!confirm(`Delete ${what}? Any athlete progress on affected skills will be removed.`))
			e.preventDefault();
	};
</script>

{#snippet orderButtons(kind: string, id: string, groupKey: string, ids: string[])}
	<form method="POST" action="?/move" use:enhance={moveIn(groupKey, ids, id)} class="flex">
		<input type="hidden" name="kind" value={kind} />
		<input type="hidden" name="id" value={id} />
		<button
			name="dir"
			value="up"
			class="rounded px-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
			title="Move up"
			aria-label="Move up"
			disabled={ids[0] === id}>↑</button
		>
		<button
			name="dir"
			value="down"
			class="rounded px-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
			title="Move down"
			aria-label="Move down"
			disabled={ids[ids.length - 1] === id}>↓</button
		>
	</form>
{/snippet}

{#snippet simpleList(
	kind: 'level' | 'event',
	title: string,
	items: { id: string; name: string }[],
	placeholder: string
)}
	<section class="card">
		<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">{title}</h2>
		<ul class="divide-y divide-slate-100">
			{#each items as it (it.id)}
				<li class="flex items-center gap-2 px-4 py-2">
					{#if editingId === it.id}
						<form
							method="POST"
							action="?/update"
							use:enhance={keep('Renamed')}
							class="flex flex-1 gap-2"
						>
							<input type="hidden" name="kind" value={kind} />
							<input type="hidden" name="id" value={it.id} />
							<input class="input py-1" name="name" value={it.name} required />
							<button class="btn-primary btn-sm">Save</button>
							<button type="button" class="btn-ghost btn-sm" onclick={() => (editingId = null)}
								>Cancel</button
							>
						</form>
					{:else}
						<span class="flex-1 text-sm font-medium">{it.name}</span>
						{#if kind === 'level'}<span class="text-xs text-slate-400"
								>{countByLevel[it.id] ?? 0} skills</span
							>{/if}
						{@render orderButtons(
							kind,
							it.id,
							kind,
							items.map((i) => i.id)
						)}
						<button
							class="text-xs text-indigo-600 hover:underline"
							onclick={() => (editingId = it.id)}>Rename</button
						>
						<form method="POST" action="?/delete" use:enhance={submit({ success: 'Deleted' })}>
							<input type="hidden" name="kind" value={kind} />
							<input type="hidden" name="id" value={it.id} />
							<button
								class="text-xs text-slate-400 hover:text-red-600"
								onclick={confirmDel(`${it.name} and all its skills`)}>Delete</button
							>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
		<form
			method="POST"
			action="?/add"
			use:enhance={submit({ success: 'Added' })}
			class="flex gap-2 border-t border-slate-100 p-3"
		>
			<input type="hidden" name="kind" value={kind} />
			<input class="input py-1.5" name="name" {placeholder} required />
			<button class="btn-secondary btn-sm">Add</button>
		</form>
	</section>
{/snippet}

{#if tab === 'structure' && canEdit}
	<div class="mt-6 grid gap-6 md:grid-cols-2">
		{@render simpleList('level', 'Levels (in order)', levels, 'e.g. Level 6, Xcel Gold')}
		{@render simpleList(
			'event',
			'Events / apparatus',
			events,
			'e.g. Rings, Pommel horse, Tumbling'
		)}
	</div>
{:else if levels.length === 0 || events.length === 0}
	<div class="mt-6">
		<Empty title="Set up levels and events first">
			{#if canEdit}<button
					class="text-indigo-600 hover:underline"
					onclick={() => (tab = 'structure')}>Add levels & events</button
				>{:else}Ask a gym owner to set up the curriculum.{/if}
		</Empty>
	</div>
{:else}
	<div class="mt-6 flex flex-wrap gap-2">
		{#each levels as l (l.id)}
			<button
				class="rounded-full px-3.5 py-1.5 text-sm font-medium {selectedLevel === l.id
					? 'bg-indigo-600 text-white'
					: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}"
				onclick={() => (selectedLevel = l.id)}
			>
				{l.name} <span class="opacity-60">· {countByLevel[l.id] ?? 0}</span>
			</button>
		{/each}
	</div>

	<div class="mt-4 grid gap-4 md:grid-cols-2">
		{#each events as ev (ev.id)}
			{@const groupKey = `${selectedLevel}:${ev.id}`}
			{@const list = ordered(groupKey, byLevelEvent[groupKey] ?? [])}
			<section class="card">
				<h3
					class="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-700"
				>
					{ev.name}
				</h3>
				<ul class="divide-y divide-slate-100">
					{#each list as s (s.id)}
						<li class="px-4 py-2">
							{#if editingId === s.id}
								<form
									method="POST"
									action="?/update"
									use:enhance={keep('Skill saved')}
									class="space-y-2"
								>
									<input type="hidden" name="kind" value="skill" />
									<input type="hidden" name="id" value={s.id} />
									<input class="input py-1" name="name" value={s.name} required />
									<input
										class="input py-1 text-xs"
										name="description"
										value={s.description ?? ''}
										placeholder="Description / criteria (optional)"
									/>
									<div class="flex gap-2">
										<select class="input py-1 text-xs" name="levelId" value={s.levelId}>
											{#each levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
										</select>
										<select class="input py-1 text-xs" name="apparatusId" value={s.apparatusId}>
											{#each events as e (e.id)}<option value={e.id}>{e.name}</option>{/each}
										</select>
									</div>
									<div class="flex justify-end gap-2">
										<button
											type="button"
											class="btn-ghost btn-sm"
											onclick={() => (editingId = null)}>Cancel</button
										>
										<button class="btn-primary btn-sm">Save</button>
									</div>
								</form>
							{:else}
								<div class="flex items-center gap-2">
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium">{s.name}</p>
										{#if s.description}<p class="text-xs text-slate-500">{s.description}</p>{/if}
									</div>
									{#if canEdit}
										{@render orderButtons(
											'skill',
											s.id,
											groupKey,
											list.map((x) => x.id)
										)}
										<button
											class="text-xs text-indigo-600 hover:underline"
											onclick={() => (editingId = s.id)}>Edit</button
										>
										<form
											method="POST"
											action="?/delete"
											use:enhance={submit({ success: 'Skill deleted' })}
										>
											<input type="hidden" name="kind" value="skill" />
											<input type="hidden" name="id" value={s.id} />
											<button
												class="text-xs text-slate-400 hover:text-red-600"
												onclick={confirmDel(`“${s.name}”`)}>Delete</button
											>
										</form>
									{/if}
								</div>
							{/if}
						</li>
					{:else}
						<li class="px-4 py-3 text-xs text-slate-400">
							No {ev.name.toLowerCase()} skills in this level.
						</li>
					{/each}
				</ul>
				{#if canEdit}
					<form
						method="POST"
						action="?/add"
						use:enhance={submit({ success: 'Skill added' })}
						class="flex gap-2 border-t border-slate-100 p-3"
					>
						<input type="hidden" name="kind" value="skill" />
						<input type="hidden" name="levelId" value={selectedLevel} />
						<input type="hidden" name="apparatusId" value={ev.id} />
						<input
							class="input py-1.5"
							name="name"
							placeholder="Add a {ev.name.toLowerCase()} skill…"
							required
						/>
						<button class="btn-secondary btn-sm">Add</button>
					</form>
				{/if}
			</section>
		{/each}
	</div>
{/if}
