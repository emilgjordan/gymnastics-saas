<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import ProgressBar from '$lib/components/ProgressBar.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import Empty from '$lib/components/Empty.svelte';

	let { data, form } = $props();
	const namesPlaceholder = 'One athlete per line, e.g.\nEmma Johnson\nLiam Chen';
	const base = $derived(`/g/${data.gym.id}`);

	let showAdd = $state(page.url.searchParams.get('new') === '1');
	let q = $state('');
	let teamFilter = $state(page.url.searchParams.get('team') ?? '');
	let levelFilter = $state(page.url.searchParams.get('level') ?? '');
	let selected = $state<string[]>([]);

	const teamName = $derived(Object.fromEntries(data.teams.map((t) => [t.id, t.name])));
	const levelName = $derived(Object.fromEntries(data.levels.map((l) => [l.id, l.name])));

	const filtered = $derived(
		data.athletes.filter(
			(a) =>
				(!q || a.name.toLowerCase().includes(q.toLowerCase())) &&
				(!teamFilter || (teamFilter === 'none' ? !a.teamId : a.teamId === teamFilter)) &&
				(!levelFilter || (levelFilter === 'none' ? !a.levelId : a.levelId === levelFilter))
		)
	);
	const allSelected = $derived(
		filtered.length > 0 && filtered.every((a) => selected.includes(a.id))
	);

	function toggleAll() {
		selected = allSelected ? [] : filtered.map((a) => a.id);
	}
</script>

<svelte:head><title>Athletes · {data.gym.name}</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="page-title">Athletes</h1>
		<p class="mt-1 muted">{data.athletes.length} athletes</p>
	</div>
	<button class="btn-primary" onclick={() => (showAdd = !showAdd)}
		>{showAdd ? 'Close' : 'Add athletes'}</button
	>
</div>

{#if showAdd}
	<form
		method="POST"
		action="?/create"
		class="mt-6 grid gap-4 card p-5 md:grid-cols-2"
		use:enhance={() =>
			async ({ result, update }) => {
				await update();
				if (result.type === 'success') {
					showAdd = false;
					goto(page.url.pathname, { replaceState: true, noScroll: true, keepFocus: true });
				}
			}}
	>
		<div class="md:col-span-2"><FormError message={form?.message} /></div>
		<div class="md:row-span-3">
			<label class="label" for="names">Name(s)</label>
			<textarea class="input h-36" id="names" name="names" required placeholder={namesPlaceholder}
			></textarea>
			<p class="mt-1 text-xs text-slate-500">Paste a list to add several at once.</p>
		</div>
		<div>
			<label class="label" for="teamId">Team</label>
			<select
				class="input"
				id="teamId"
				name="teamId"
				value={teamFilter && teamFilter !== 'none' ? teamFilter : ''}
			>
				<option value="">No team</option>
				{#each data.teams as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
			</select>
		</div>
		<div>
			<label class="label" for="levelId">Level</label>
			<select class="input" id="levelId" name="levelId">
				<option value="">No level</option>
				{#each data.levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
			</select>
		</div>
		<div>
			<label class="label" for="birthYear"
				>Birth year <span class="font-normal text-slate-400">(optional)</span></label
			>
			<input class="input" id="birthYear" name="birthYear" type="number" min="1950" max="2100" />
		</div>
		<div class="flex justify-end md:col-span-2"><button class="btn-primary">Add</button></div>
	</form>
{/if}
{#if form?.created}
	<p class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
		Added {form.created} athlete{form.created === 1 ? '' : 's'}.
	</p>
{/if}

<div class="mt-6 flex flex-wrap gap-3">
	<input class="input max-w-xs" placeholder="Search by name…" bind:value={q} type="search" />
	<select class="input w-auto" bind:value={teamFilter}>
		<option value="">All teams</option>
		<option value="none">No team</option>
		{#each data.teams as t (t.id)}<option value={t.id}>{t.name}</option>{/each}
	</select>
	<select class="input w-auto" bind:value={levelFilter}>
		<option value="">All levels</option>
		<option value="none">No level</option>
		{#each data.levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
	</select>
</div>

{#if selected.length}
	<form
		method="POST"
		action="?/bulkUpdate"
		class="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm"
		use:enhance={() =>
			async ({ update }) => {
				await update();
				selected = [];
			}}
	>
		{#each selected as id (id)}<input type="hidden" name="ids" value={id} />{/each}
		<span class="font-medium text-indigo-900">{selected.length} selected</span>
		<span class="text-indigo-300">|</span>
		<select name="field" class="input w-auto py-1 text-xs" id="bulk-field">
			<option value="level">Set level</option>
			<option value="team">Set team</option>
		</select>
		<select name="value" class="input w-auto py-1 text-xs">
			<option value="">— none —</option>
			<optgroup label="Levels"
				>{#each data.levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}</optgroup
			>
			<optgroup label="Teams"
				>{#each data.teams as t (t.id)}<option value={t.id}>{t.name}</option>{/each}</optgroup
			>
		</select>
		<button class="btn-primary btn-sm">Apply</button>
		<button type="button" class="btn-ghost btn-sm" onclick={() => (selected = [])}>Clear</button>
	</form>
{/if}

<div class="mt-4">
	{#if data.athletes.length === 0}
		<Empty title="No athletes yet">Add your first athletes to start tracking their skills.</Empty>
	{:else}
		<div class="overflow-x-auto card">
			<table class="w-full text-sm">
				<thead
					class="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-medium text-slate-500"
				>
					<tr>
						<th class="w-10 px-4 py-2.5"
							><input
								type="checkbox"
								class="rounded border-slate-300 text-indigo-600"
								checked={allSelected}
								onchange={toggleAll}
								aria-label="Select all"
							/></th
						>
						<th class="px-4 py-2.5">Name</th>
						<th class="px-4 py-2.5">Team</th>
						<th class="px-4 py-2.5">Level</th>
						<th class="min-w-44 px-4 py-2.5">Level progress</th>
						<th class="px-4 py-2.5">Login</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100">
					{#each filtered as a (a.id)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-2.5"
								><input
									type="checkbox"
									class="rounded border-slate-300 text-indigo-600"
									bind:group={selected}
									value={a.id}
									aria-label="Select {a.name}"
								/></td
							>
							<td class="px-4 py-2.5 font-medium"
								><a href="{base}/athletes/{a.id}" class="hover:text-indigo-600">{a.name}</a></td
							>
							<td class="px-4 py-2.5 text-slate-600">{a.teamId ? teamName[a.teamId] : '—'}</td>
							<td class="px-4 py-2.5 text-slate-600">{a.levelId ? levelName[a.levelId] : '—'}</td>
							<td class="px-4 py-2.5">
								{#if a.progress}
									<div class="flex items-center gap-2">
										<div class="flex-1">
											<ProgressBar
												size="sm"
												mastered={a.progress.mastered}
												working={a.progress.working}
												total={a.progress.total}
											/>
										</div>
										<span class="w-9 text-right text-xs text-slate-500">{a.progress.percent}%</span>
									</div>
									{#if a.progress.readyToMoveUp}<p
											class="mt-0.5 text-xs font-medium text-emerald-700"
										>
											Ready for {a.progress.nextLevel?.name}
										</p>{/if}
								{:else}
									<span class="text-xs text-slate-400">No level</span>
								{/if}
							</td>
							<td class="px-4 py-2.5 text-xs"
								>{#if a.hasLogin}<span class="text-emerald-700">Active</span>{:else}<span
										class="text-slate-400">Not invited</span
									>{/if}</td
							>
						</tr>
					{:else}
						<tr
							><td colspan="6" class="px-4 py-8 text-center text-slate-500"
								>No athletes match these filters.</td
							></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
