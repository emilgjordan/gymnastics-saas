<script lang="ts">
	import { enhance } from '$app/forms';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import Empty from '$lib/components/Empty.svelte';
	import { submit } from '$lib/forms';
	import { createOptimistic } from '$lib/optimistic.svelte';
	import { nextStatus, statusLabel, type SkillStatus } from '$lib/progress';
	import type { PageData } from './$types';

	let { v, base, teamId }: { v: Awaited<PageData['view']>; base: string; teamId: string } =
		$props();
	const c = $derived(v.curriculum);

	let addingAthletes = $state(false);
	// svelte-ignore state_referenced_locally
	let matrixLevel = $state(v.defaultLevelId);
	let onlyAtLevel = $state(true);

	// Matrix clicks update instantly; the server is reconciled once clicking stops.
	const cells = createOptimistic<SkillStatus>(() => v.statuses);

	const levelName = $derived(Object.fromEntries(c.levels.map((l) => [l.id, l.name])));
	const matrixSkills = $derived(
		c.events.flatMap((e) =>
			c.skills
				.filter((s) => s.levelId === matrixLevel && s.apparatusId === e.id)
				.map((s) => ({ ...s, eventName: e.name }))
		)
	);
	const eventSpans = $derived(
		c.events
			.map((e) => ({ name: e.name, n: matrixSkills.filter((s) => s.apparatusId === e.id).length }))
			.filter((e) => e.n > 0)
	);
	const matrixAthletes = $derived(
		onlyAtLevel ? v.athletes.filter((a) => a.levelId === matrixLevel) : v.athletes
	);

	const st = (aid: string, sid: string) =>
		cells.get(`${aid}:${sid}`) ?? ((v.statuses[aid]?.[sid] ?? 'not_started') as SkillStatus);
	const cellCls: Record<SkillStatus, string> = {
		not_started: 'bg-white hover:bg-slate-100 text-slate-300',
		working: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
		mastered: 'bg-emerald-500 hover:bg-emerald-600 text-white'
	};
</script>

<div class="mt-6 grid gap-6 lg:grid-cols-3">
	<section class="card lg:col-span-2">
		<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
			<h2 class="font-semibold">Athletes ({v.athletes.length})</h2>
			<button class="btn-secondary btn-sm" onclick={() => (addingAthletes = !addingAthletes)}
				>{addingAthletes ? 'Close' : 'Add athletes'}</button
			>
		</div>
		{#if addingAthletes}
			<form
				method="POST"
				action="?/addAthletes"
				use:enhance={submit({
					success: 'Added to team',
					onSuccess: () => (addingAthletes = false)
				})}
				class="border-b border-slate-100 bg-slate-50 p-4"
			>
				{#if v.otherAthletes.length}
					<div class="grid max-h-56 gap-1 overflow-y-auto sm:grid-cols-2">
						{#each v.otherAthletes as a (a.id)}
							<label class="flex items-center gap-2 text-sm"
								><input
									type="checkbox"
									name="athleteIds"
									value={a.id}
									class="rounded border-slate-300 text-indigo-600"
								/>{a.name}</label
							>
						{/each}
					</div>
					<div class="mt-3 flex justify-end gap-2">
						<a href="{base}/athletes?new=1&team={teamId}" class="btn-ghost btn-sm"
							>Create new athlete</a
						>
						<button class="btn-primary btn-sm">Add to team</button>
					</div>
				{:else}
					<p class="muted">
						All athletes are already on this team. <a
							href="{base}/athletes?new=1&team={teamId}"
							class="text-indigo-600 hover:underline">Create a new athlete</a
						>
					</p>
				{/if}
			</form>
		{/if}
		{#if v.athletes.length}
			<ul class="divide-y divide-slate-100">
				{#each v.athletes as a (a.id)}
					<li class="flex items-center gap-4 px-4 py-2.5 text-sm">
						<a
							href="{base}/athletes/{a.id}"
							class="min-w-0 flex-1 font-medium hover:text-indigo-600">{a.name}</a
						>
						<span class="w-20 text-xs text-slate-500"
							>{a.levelId ? levelName[a.levelId] : 'No level'}</span
						>
						<div class="w-28">
							{#if a.progress}<ProgressBar
									size="sm"
									mastered={a.progress.mastered}
									working={a.progress.working}
									total={a.progress.total}
								/>{/if}
						</div>
						<span
							class="w-20 text-xs {a.progress?.readyToMoveUp
								? 'font-medium text-emerald-700'
								: 'text-slate-500'}"
						>
							{a.progress ? (a.progress.readyToMoveUp ? 'Ready ↑' : `${a.progress.percent}%`) : ''}
						</span>
						<form
							method="POST"
							action="?/removeAthlete"
							use:enhance={submit({ success: `Removed ${a.name}` })}
						>
							<input type="hidden" name="athleteId" value={a.id} />
							<button class="text-xs text-slate-400 hover:text-red-600" title="Remove from team"
								>Remove</button
							>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="p-6 text-center muted">No athletes on this team yet.</p>
		{/if}
	</section>

	<section class="self-start card">
		<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">Coaches</h2>
		<ul class="divide-y divide-slate-100">
			{#each v.coaches as co (co.memberId)}
				<li class="flex items-center justify-between px-4 py-2.5 text-sm">
					<div>
						<p class="font-medium">{co.name}</p>
						<p class="text-xs text-slate-500">{co.email}</p>
					</div>
					<form method="POST" action="?/removeCoach" use:enhance={submit()}>
						<input type="hidden" name="memberId" value={co.memberId} />
						<button class="text-xs text-slate-400 hover:text-red-600">Remove</button>
					</form>
				</li>
			{:else}
				<li class="muted px-4 py-4">No coaches assigned.</li>
			{/each}
		</ul>
		{#if v.availableCoaches.length}
			<form
				method="POST"
				action="?/addCoach"
				use:enhance={submit({ success: 'Coach assigned' })}
				class="flex gap-2 border-t border-slate-100 p-4"
			>
				<select name="memberId" class="input py-1.5">
					{#each v.availableCoaches as s (s.memberId)}<option value={s.memberId}>{s.name}</option
						>{/each}
				</select>
				<button class="btn-secondary btn-sm">Assign</button>
			</form>
		{/if}
	</section>
</div>

<section class="mt-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="font-semibold">Skill matrix</h2>
			<p class="muted">Click a cell to cycle: not started → working on → mastered.</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<label class="flex items-center gap-2 text-sm text-slate-600"
				><input
					type="checkbox"
					bind:checked={onlyAtLevel}
					class="rounded border-slate-300 text-indigo-600"
				/> Only athletes at this level</label
			>
			<select class="input w-auto" bind:value={matrixLevel}>
				{#each c.levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
			</select>
		</div>
	</div>

	<div class="mt-4">
		{#if !matrixSkills.length}
			<Empty title="No skills in this level">Add skills on the curriculum page.</Empty>
		{:else if !matrixAthletes.length}
			<Empty title="No athletes at this level"
				>Untick “Only athletes at this level” to see everyone on the team.</Empty
			>
		{:else}
			<div class="overflow-x-auto card">
				<table class="text-xs">
					<thead>
						<tr class="border-b border-slate-200 bg-slate-50/60">
							<th class="sticky left-0 z-10 bg-slate-50"></th>
							{#each eventSpans as e (e.name)}
								<th
									colspan={e.n}
									class="border-l border-slate-200 px-2 py-1.5 text-center font-semibold text-slate-600"
									>{e.name}</th
								>
							{/each}
						</tr>
						<tr class="border-b border-slate-200">
							<th class="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-slate-500"
								>Athlete</th
							>
							{#each matrixSkills as s, i (s.id)}
								<th
									class="h-32 w-10 min-w-10 align-bottom {i === 0 ||
									matrixSkills[i - 1].apparatusId !== s.apparatusId
										? 'border-l border-slate-200'
										: ''}"
								>
									<div
										class="mx-auto w-6 rotate-180 pb-2 text-left font-medium whitespace-nowrap text-slate-700 [writing-mode:vertical-rl]"
										title={s.name}
									>
										{s.name}
									</div>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each matrixAthletes as a (a.id)}
							<tr>
								<td class="sticky left-0 z-10 bg-white px-3 py-1 font-medium whitespace-nowrap">
									<a href="{base}/athletes/{a.id}" class="hover:text-indigo-600">{a.name}</a>
								</td>
								{#each matrixSkills as s, i (s.id)}
									{@const cur = st(a.id, s.id)}
									<td
										class="p-0.5 {i === 0 || matrixSkills[i - 1].apparatusId !== s.apparatusId
											? 'border-l border-slate-200'
											: ''}"
									>
										<form
											method="POST"
											action="?/setStatus"
											use:enhance={cells.enhance(
												`${a.id}:${s.id}`,
												(fd) => String(fd.get('status')) as SkillStatus
											)}
										>
											<input type="hidden" name="athleteId" value={a.id} />
											<input type="hidden" name="skillId" value={s.id} />
											<button
												name="status"
												value={nextStatus(cur)}
												class="grid size-9 place-items-center rounded text-sm font-bold ring-1 ring-slate-200 transition ring-inset {cellCls[
													cur
												]}"
												title="{a.name} — {s.name}: {statusLabel[cur]}"
												>{#if cur === 'mastered'}✓{:else if cur === 'working'}<span
														class="size-2.5 rounded-full bg-amber-500"
													></span>{/if}</button
											>
										</form>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="mt-2 flex gap-4 text-xs text-slate-500">
				<span
					><span class="inline-block size-3 rounded bg-white align-middle ring-1 ring-slate-200"
					></span> Not started</span
				>
				<span
					><span class="inline-block size-3 rounded bg-amber-100 align-middle ring-1 ring-amber-200"
					></span> Working on</span
				>
				<span
					><span class="inline-block size-3 rounded bg-emerald-500 align-middle"></span> Mastered</span
				>
			</div>
		{/if}
	</div>
</section>
