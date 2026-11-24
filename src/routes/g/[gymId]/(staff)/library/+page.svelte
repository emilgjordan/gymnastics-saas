<script lang="ts">
	import { enhance } from '$app/forms';
	import FormError from '$lib/components/FormError.svelte';

	let { data, form } = $props();
	const base = $derived(`/g/${data.gym.id}/library`);
	const canEdit = $derived(data.role === 'owner');
	const isVault = $derived(data.apparatus === 'Vault');

	let q = $state('');
	let group = $state('');
	let values = $state<string[]>([]);
	let selected = $state<string[]>([]);
	// svelte-ignore state_referenced_locally
	let levelId = $state(data.levels[0]?.id ?? '');
	// svelte-ignore state_referenced_locally
	let eventId = $state(data.suggestedEventId ?? 'new');

	// reset filters/selection when switching apparatus
	$effect(() => {
		void data.apparatus;
		void data.discipline;
		q = '';
		group = '';
		values = [];
		selected = [];
		eventId = data.suggestedEventId ?? 'new';
	});

	const groups = $derived(
		[...new Map(data.elements.map((e) => [e.group ?? '', e.groupName ?? ''])).entries()].filter(
			([g]) => g
		)
	);
	const valueOptions = $derived(
		isVault ? [] : [...new Set(data.elements.map((e) => e.value ?? ''))].filter(Boolean).sort()
	);
	const filtered = $derived(
		data.elements.filter(
			(e) =>
				(!group || e.group === group) &&
				(!values.length || values.includes(e.value ?? '')) &&
				(!q ||
					`${e.description} ${e.names.join(' ')} ${e.code}`.toLowerCase().includes(q.toLowerCase()))
		)
	);
	const existing = $derived(new Set(data.existingKeys));
	const inCurriculum = (desc: string) =>
		eventId !== 'new' && existing.has(`${levelId}|${eventId}|${desc.toLowerCase()}`);
	const allSelected = $derived(
		filtered.length > 0 && filtered.every((e) => selected.includes(e.id))
	);

	function toggleValue(v: string) {
		values = values.includes(v) ? values.filter((x) => x !== v) : [...values, v];
	}
	function toggleAll() {
		const ids = new Set(filtered.map((e) => e.id));
		selected = allSelected
			? selected.filter((id) => !ids.has(id))
			: [...new Set([...selected, ...ids])];
	}

	const valueCls = (v: string | null) => {
		const i = 'ABCDEFGHIJ'.indexOf(v ?? '');
		if (i < 0) return 'bg-indigo-50 text-indigo-700 ring-indigo-200';
		if (i < 2) return 'bg-slate-100 text-slate-700 ring-slate-200';
		if (i < 4) return 'bg-sky-50 text-sky-700 ring-sky-200';
		if (i < 6) return 'bg-violet-50 text-violet-700 ring-violet-200';
		return 'bg-rose-50 text-rose-700 ring-rose-200';
	};
</script>

<svelte:head><title>Skill library · {data.gym.name}</title></svelte:head>

<h1 class="page-title">Skill library</h1>
<p class="mt-1 muted">
	Every element from the FIG Code of Points 2025–2028.
	{canEdit
		? 'Select skills to add them to one of your levels.'
		: 'Ask a gym owner to add skills to your curriculum.'}
</p>

<div class="mt-6 flex flex-wrap items-center gap-3">
	<div class="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
		{#each [['WAG', "Women's"], ['MAG', "Men's"]] as [d, label] (d)}
			<a
				href="{base}?d={d}"
				data-sveltekit-noscroll
				class="rounded-md px-3 py-1.5 font-medium {data.discipline === d
					? 'bg-white shadow-sm'
					: 'text-slate-600'}">{label}</a
			>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2">
		{#each data.apparatusList as a (a)}
			<a
				href="{base}?d={data.discipline}&a={encodeURIComponent(a)}"
				data-sveltekit-noscroll
				class="rounded-full px-3.5 py-1.5 text-sm font-medium {data.apparatus === a
					? 'bg-indigo-600 text-white'
					: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}">{a}</a
			>
		{/each}
	</div>
</div>

<div class="mt-4 flex flex-wrap items-center gap-3">
	<input
		class="input max-w-xs"
		type="search"
		placeholder="Search skills or names (e.g. Yurchenko)…"
		bind:value={q}
	/>
	{#if groups.length}
		<select class="input w-auto" bind:value={group}>
			<option value="">All element groups</option>
			{#each groups as [g, name] (g)}<option value={g}
					>{isVault ? 'Group' : data.discipline === 'MAG' ? 'EG' : 'Group'}
					{g}{name ? ` – ${name}` : ''}</option
				>{/each}
		</select>
	{/if}
	{#if valueOptions.length}
		<div class="flex flex-wrap items-center gap-1">
			<span class="mr-1 text-xs font-medium text-slate-500">Value:</span>
			{#each valueOptions as v (v)}
				<button
					type="button"
					onclick={() => toggleValue(v)}
					class="size-7 rounded-md text-xs font-semibold ring-1 ring-inset {values.includes(v)
						? 'bg-slate-900 text-white ring-slate-900'
						: 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}">{v}</button
				>
			{/each}
		</div>
	{/if}
	<span class="text-sm text-slate-500">{filtered.length} of {data.elements.length}</span>
</div>

{#if form?.message}<div class="mt-4"><FormError message={form.message} /></div>{/if}
{#if form?.added !== undefined}
	<p class="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
		Added {form.added} skill{form.added === 1 ? '' : 's'} to your curriculum{form.skipped
			? ` (${form.skipped} already there)`
			: ''}.
	</p>
{/if}

{#if canEdit && selected.length}
	<form
		method="POST"
		action="?/add"
		class="sticky top-2 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm text-white shadow-lg"
		use:enhance={() =>
			async ({ result, update }) => {
				await update();
				if (result.type === 'success') selected = [];
			}}
	>
		{#each selected as id (id)}<input type="hidden" name="ids" value={id} />{/each}
		<span class="font-medium">{selected.length} selected — add to</span>
		{#if data.levels.length}
			<select
				name="levelId"
				bind:value={levelId}
				class="input w-auto border-0 py-1 text-xs text-slate-900"
			>
				{#each data.levels as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
			</select>
			<select
				name="eventId"
				bind:value={eventId}
				class="input w-auto border-0 py-1 text-xs text-slate-900"
			>
				{#each data.events as e (e.id)}<option value={e.id}>{e.name}</option>{/each}
				<option value="new">+ New event “{data.apparatus}”</option>
			</select>
			<button class="btn bg-white btn-sm text-indigo-700 hover:bg-indigo-50"
				>Add to curriculum</button
			>
		{:else}
			<span
				>— create a level on the <a class="underline" href="/g/{data.gym.id}/curriculum"
					>Curriculum</a
				> page first.</span
			>
		{/if}
		<button
			type="button"
			class="ml-auto rounded-lg btn-sm px-2 py-1 text-indigo-100 hover:bg-indigo-500"
			onclick={() => (selected = [])}>Clear</button
		>
	</form>
{/if}

<div class="mt-4 overflow-x-auto card">
	<table class="w-full text-sm">
		<thead
			class="border-b border-slate-200 bg-slate-50/60 text-left text-xs font-medium text-slate-500"
		>
			<tr>
				{#if canEdit}
					<th class="w-10 px-4 py-2.5"
						><input
							type="checkbox"
							class="rounded border-slate-300 text-indigo-600"
							checked={allSelected}
							onchange={toggleAll}
							aria-label="Select all shown"
						/></th
					>
				{/if}
				<th class="w-24 px-3 py-2.5">{isVault ? 'Vault' : 'Element'}</th>
				<th class="w-24 px-3 py-2.5">{isVault ? 'D-score' : 'Value'}</th>
				<th class="px-3 py-2.5">Description</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-100">
			{#each filtered as e (e.id)}
				<tr class="align-top hover:bg-slate-50">
					{#if canEdit}
						<td class="px-4 py-2.5"
							><input
								type="checkbox"
								class="rounded border-slate-300 text-indigo-600"
								bind:group={selected}
								value={e.id}
								aria-label="Select {e.code}"
							/></td
						>
					{/if}
					<td class="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-slate-500">{e.code}</td>
					<td class="px-3 py-2.5">
						{#if e.value}<span
								class="inline-flex min-w-7 justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset {valueCls(
									e.value
								)}">{e.value}</span
							>{/if}
					</td>
					<td class="px-3 py-2.5">
						<p class="text-slate-800">{e.description}</p>
						<div class="mt-0.5 flex flex-wrap gap-1.5 text-xs">
							{#if e.groupName}<span class="text-slate-400">{e.groupName}</span>{/if}
							{#if e.dance}<span class="rounded bg-pink-50 px-1.5 text-pink-700">Dance</span>{/if}
							{#if canEdit && inCurriculum(e.description)}<span
									class="rounded bg-emerald-50 px-1.5 text-emerald-700">In this level</span
								>{/if}
						</div>
					</td>
				</tr>
			{:else}
				<tr
					><td colspan="4" class="px-4 py-10 text-center text-slate-500"
						>No skills match these filters.</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>

<p class="mt-4 text-xs text-slate-400">
	Source: {data.source}. Descriptions are abbreviated as in the Code; always check the official
	document and the latest FIG newsletters for the authoritative values.
</p>
