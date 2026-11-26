<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { submit } from '$lib/forms';
	import ProgressBar from './ProgressBar.svelte';
	import StatusBadge from './StatusBadge.svelte';
	import { statusLabel, statusOrder, summarize, type SkillStatus } from '$lib/progress';

	type Lvl = { id: string; name: string };
	type Ev = { id: string; name: string };
	type Sk = {
		id: string;
		name: string;
		description: string | null;
		levelId: string;
		apparatusId: string;
	};
	type St = { status: SkillStatus; note: string | null; masteredAt: Date | string | null };

	let {
		levels,
		events,
		skills,
		statuses,
		currentLevelId,
		editable = false,
		onStatus
	}: {
		levels: Lvl[];
		events: Ev[];
		skills: Sk[];
		statuses: Record<string, St>;
		currentLevelId: string | null;
		editable?: boolean;
		/** Optimistic handler for status buttons; falls back to a plain reload when omitted. */
		onStatus?: (skillId: string) => SubmitFunction;
	} = $props();

	// svelte-ignore state_referenced_locally
	let selected = $state(currentLevelId ?? levels[0]?.id ?? null);
	let filter = $state<'all' | SkillStatus>('all');
	let editingNote = $state<string | null>(null);

	const statusOf = (id: string): SkillStatus => statuses[id]?.status ?? 'not_started';

	const perLevel = $derived.by(() => {
		const byLevel: Record<string, SkillStatus[]> = {};
		for (const s of skills) (byLevel[s.levelId] ??= []).push(statusOf(s.id));
		return Object.fromEntries(levels.map((l) => [l.id, summarize(byLevel[l.id] ?? [])]));
	});

	const groups = $derived(
		events
			.map((e) => ({
				event: e,
				skills: skills.filter(
					(s) =>
						s.levelId === selected &&
						s.apparatusId === e.id &&
						(filter === 'all' || statusOf(s.id) === filter)
				)
			}))
			.filter((g) => g.skills.length > 0)
	);

	const segCls: Record<SkillStatus, string> = {
		not_started: 'bg-slate-600 text-white',
		working: 'bg-amber-500 text-white',
		mastered: 'bg-emerald-600 text-white'
	};

	const fmt = (d: Date | string | null) => (d ? new Date(d).toLocaleDateString() : '');
</script>

{#if levels.length === 0}
	<p class="muted">No levels have been set up yet.</p>
{:else}
	<div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
		{#each levels as l (l.id)}
			{@const p = perLevel[l.id]}
			<button
				type="button"
				onclick={() => (selected = l.id)}
				class="min-w-36 shrink-0 rounded-xl border px-3 py-2.5 text-left transition {selected ===
				l.id
					? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
					: 'border-slate-200 bg-white hover:border-slate-300'}"
			>
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-semibold">{l.name}</span>
					{#if l.id === currentLevelId}
						<span
							class="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase"
							>Current</span
						>
					{:else if p.complete}
						<span class="text-emerald-600" title="All mastered">✓</span>
					{/if}
				</div>
				<div class="mt-2">
					<ProgressBar size="sm" mastered={p.mastered} working={p.working} total={p.total} />
				</div>
				<p class="mt-1 text-xs text-slate-500">{p.mastered}/{p.total} mastered</p>
			</button>
		{/each}
	</div>

	<div class="mt-4 flex flex-wrap items-center gap-2">
		<span class="text-xs font-medium text-slate-500">Show:</span>
		{#each ['all', ...statusOrder] as f (f)}
			<button
				type="button"
				class="rounded-full px-3 py-1 text-xs font-medium {filter === f
					? 'bg-slate-900 text-white'
					: 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}"
				onclick={() => (filter = f as typeof filter)}
			>
				{f === 'all' ? 'All' : statusLabel[f as SkillStatus]}
			</button>
		{/each}
	</div>

	<div class="mt-4 grid gap-4 md:grid-cols-2">
		{#each groups as g (g.event.id)}
			<section class="overflow-hidden card">
				<h3
					class="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-sm font-semibold text-slate-700"
				>
					{g.event.name}
				</h3>
				<ul class="divide-y divide-slate-100">
					{#each g.skills as s (s.id)}
						{@const st = statusOf(s.id)}
						{@const rec = statuses[s.id]}
						<li class="px-4 py-3">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="min-w-0">
									<p class="text-sm font-medium text-slate-900">{s.name}</p>
									{#if s.description}<p class="text-xs text-slate-500">{s.description}</p>{/if}
								</div>
								{#if editable}
									<form
										method="POST"
										action="?/setStatus"
										use:enhance={onStatus ? onStatus(s.id) : submit({ reset: false })}
									>
										<input type="hidden" name="skillId" value={s.id} />
										<div
											class="inline-flex overflow-hidden rounded-lg ring-1 ring-slate-200"
											role="group"
											aria-label="Status for {s.name}"
										>
											{#each statusOrder as opt (opt)}
												<button
													name="status"
													value={opt}
													class="px-2.5 py-1 text-xs font-medium transition {st === opt
														? segCls[opt]
														: 'bg-white text-slate-600 hover:bg-slate-50'}"
													aria-pressed={st === opt}
												>
													{opt === 'not_started'
														? 'Not yet'
														: opt === 'working'
															? 'Working'
															: 'Mastered'}
												</button>
											{/each}
										</div>
									</form>
								{:else}
									<StatusBadge status={st} />
								{/if}
							</div>

							{#if editingNote === s.id}
								<form
									method="POST"
									action="?/setNote"
									class="mt-2 flex gap-2"
									use:enhance={submit({
										reset: false,
										success: 'Note saved',
										onSuccess: () => (editingNote = null)
									})}
								>
									<input type="hidden" name="skillId" value={s.id} />
									<!-- svelte-ignore a11y_autofocus -->
									<input
										class="input py-1 text-xs"
										name="note"
										value={rec?.note ?? ''}
										placeholder="Coach note (e.g. needs a spot, work on arms)"
										autofocus
									/>
									<button class="btn-primary btn-sm">Save</button>
									<button
										type="button"
										class="btn-ghost btn-sm"
										onclick={() => (editingNote = null)}>Cancel</button
									>
								</form>
							{:else if rec?.note || rec?.masteredAt || editable}
								<div
									class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500"
								>
									{#if rec?.note}<span class="italic">“{rec.note}”</span>{/if}
									{#if st === 'mastered' && rec?.masteredAt}<span
											>Mastered {fmt(rec.masteredAt)}</span
										>{/if}
									{#if editable}
										<button
											type="button"
											class="text-indigo-600 hover:underline"
											onclick={() => (editingNote = s.id)}
										>
											{rec?.note ? 'Edit note' : 'Add note'}
										</button>
									{/if}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{:else}
			<div class="md:col-span-2">
				<p class="muted rounded-xl border border-dashed border-slate-300 p-8 text-center">
					{filter === 'all'
						? 'No skills in this level yet.'
						: `No skills marked “${statusLabel[filter as SkillStatus]}” in this level.`}
				</p>
			</div>
		{/each}
	</div>
{/if}
