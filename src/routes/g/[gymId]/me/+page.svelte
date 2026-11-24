<script lang="ts">
	import SkillBoard from '$lib/components/SkillBoard.svelte';
	import ActivityList from '$lib/components/ActivityList.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import { summarize } from '$lib/progress';
	let { data } = $props();
	const c = $derived(data.curriculum);
</script>

{#if data.profiles.length === 0}
	<div class="mx-auto max-w-lg card p-8 text-center">
		<h1 class="text-xl font-semibold">You're in!</h1>
		<p class="mt-2 muted">
			Your coach hasn't linked an athlete profile to your login yet. Ask them to send you your
			personal invite link.
		</p>
	</div>
{/if}

{#each data.profiles as p (p.athlete.id)}
	{@const lvl = c.levels.find((l) => l.id === p.athlete.levelId)}
	{@const lvlSkills = c.skills.filter((s) => s.levelId === p.athlete.levelId)}
	{@const prog = summarize(lvlSkills.map((s) => p.statuses[s.id]?.status ?? 'not_started'))}
	{@const working = lvlSkills.filter((s) => p.statuses[s.id]?.status === 'working')}
	{@const totalMastered = Object.values(p.statuses).filter((s) => s.status === 'mastered').length}
	<div class="mb-12">
		<h1 class="page-title">Hi, {p.athlete.name.split(' ')[0]}! 👋</h1>
		<p class="mt-1 muted">
			{p.athlete.teamName ?? 'No team'} · {lvl?.name ?? 'No level assigned yet'}
		</p>

		<div class="mt-6 grid gap-4 md:grid-cols-3">
			<div class="card p-5 md:col-span-2">
				<p class="text-xs font-medium text-slate-500">Progress in {lvl?.name ?? 'your level'}</p>
				<p class="mt-1 text-3xl font-semibold">{prog.percent}%</p>
				<div class="mt-3">
					<ProgressBar mastered={prog.mastered} working={prog.working} total={prog.total} />
				</div>
				<p class="mt-2 text-sm text-slate-600">
					{prog.mastered} mastered · {prog.working} working on · {prog.total -
						prog.mastered -
						prog.working} to go
				</p>
				{#if prog.complete}
					<p class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
						🎉 You've mastered every skill in this level! Talk to your coach about moving up.
					</p>
				{/if}
			</div>
			<div class="card p-5">
				<p class="text-xs font-medium text-slate-500">Skills mastered (all levels)</p>
				<p class="mt-1 text-3xl font-semibold">{totalMastered}</p>
			</div>
		</div>

		{#if working.length}
			<section class="mt-6 card p-5">
				<h2 class="font-semibold">Currently working on</h2>
				<ul class="mt-3 flex flex-wrap gap-2">
					{#each working as s (s.id)}
						<li
							class="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset"
						>
							{s.name}{#if p.statuses[s.id]?.note}<span class="text-amber-600"
									>&nbsp;— {p.statuses[s.id].note}</span
								>{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<h2 class="mt-8 mb-3 font-semibold">All skills</h2>
		<SkillBoard
			levels={c.levels}
			events={c.events}
			skills={c.skills}
			statuses={p.statuses}
			currentLevelId={p.athlete.levelId}
		/>

		<section class="mt-8 card">
			<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">Recent progress</h2>
			<ActivityList items={p.activity} showAthlete={false} />
		</section>
	</div>
{/each}
