<script lang="ts">
	import ActivityList from '$lib/components/ActivityList.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	let { data } = $props();
	const base = $derived(`/g/${data.gym.id}`);
	const cards = $derived([
		{ label: 'Athletes', value: data.stats.athletes, href: `${base}/athletes` },
		{ label: 'Teams', value: data.stats.teams, href: `${base}/teams` },
		{ label: 'Skills in curriculum', value: data.stats.skills, href: `${base}/curriculum` },
		{ label: 'Skills mastered (30 days)', value: data.stats.mastered30, href: null }
	]);
</script>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="page-title">Dashboard</h1>
		<p class="mt-1 muted">Welcome back, {data.user?.name?.split(' ')[0]}.</p>
	</div>
	<a href="{base}/athletes?new=1" class="btn-primary">Add athlete</a>
</div>

{#if data.stats.athletes === 0}
	<div class="mt-6 card p-6">
		<h2 class="font-semibold">Getting started</h2>
		<ol class="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
			<li>
				Review your <a class="text-indigo-600 hover:underline" href="{base}/curriculum"
					>levels and skills</a
				>.
			</li>
			<li>
				Create <a class="text-indigo-600 hover:underline" href="{base}/teams">teams</a> (e.g. Girls Level
				3, Boys Rec).
			</li>
			<li>
				Add <a class="text-indigo-600 hover:underline" href="{base}/athletes?new=1">athletes</a> and give
				each a level.
			</li>
			{#if data.role === 'owner'}<li>
					Invite your <a class="text-indigo-600 hover:underline" href="{base}/staff">coaches</a>.
				</li>{/if}
		</ol>
	</div>
{/if}

<div class="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each cards as c (c.label)}
		<svelte:element
			this={c.href ? 'a' : 'div'}
			href={c.href}
			class="card p-5 {c.href ? 'hover:border-indigo-300' : ''}"
		>
			<p class="text-xs font-medium text-slate-500">{c.label}</p>
			<p class="mt-1 text-3xl font-semibold">{c.value}</p>
		</svelte:element>
	{/each}
</div>

<div class="mt-6 grid gap-6 lg:grid-cols-3">
	<div class="space-y-6 lg:col-span-2">
		<section class="card">
			<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<h2 class="font-semibold">Ready to move up</h2>
				<span class="text-xs text-slate-500">Mastered every skill in their level</span>
			</div>
			{#if data.ready.length}
				<ul class="divide-y divide-slate-100">
					{#each data.ready as a (a.id)}
						<li>
							<a
								href="{base}/athletes/{a.id}"
								class="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
							>
								<span class="font-medium">{a.name}</span>
								<span class="text-slate-500"
									>{a.level} → <span class="font-medium text-emerald-700">{a.next}</span></span
								>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="px-4 py-6 text-center muted">Nobody yet — keep going!</p>
			{/if}
		</section>

		<section class="card">
			<div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
				<h2 class="font-semibold">Teams</h2>
				<a href="{base}/teams" class="text-xs text-indigo-600 hover:underline">View all</a>
			</div>
			{#if data.teams.length}
				<ul class="divide-y divide-slate-100">
					{#each data.teams as t (t.id)}
						<li>
							<a
								href="{base}/teams/{t.id}"
								class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-slate-50"
							>
								<div class="min-w-0 flex-1">
									<p class="font-medium">
										{t.name}
										{#if t.mine}<span
												class="ml-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase"
												>My team</span
											>{/if}
									</p>
									<p class="text-xs text-slate-500">{t.athletes} athletes</p>
								</div>
								<div class="w-32">
									<ProgressBar size="sm" mastered={t.avg} total={100} />
									<p class="mt-1 text-right text-xs text-slate-500">{t.avg}% of level</p>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="px-4 py-6 text-center muted">No teams yet.</p>
			{/if}
		</section>
		{#if data.unassigned > 0}
			<p
				class="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 ring-inset"
			>
				{data.unassigned} athlete{data.unassigned === 1 ? ' has' : 's have'} no level yet.
				<a href="{base}/athletes?level=none" class="font-medium underline">Assign levels</a>
			</p>
		{/if}
	</div>

	<section class="self-start card">
		<h2 class="border-b border-slate-100 px-4 py-3 font-semibold">Recent activity</h2>
		<ActivityList items={data.activity} gymId={data.gym.id} />
	</section>
</div>
