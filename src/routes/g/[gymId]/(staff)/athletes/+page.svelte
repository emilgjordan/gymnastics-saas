<script lang="ts">
	import { page } from '$app/state';
	import Streamed from '$lib/components/Streamed.svelte';
	import Bone from '$lib/components/skeletons/Bone.svelte';
	import AthletesView from './AthletesView.svelte';

	let { data, form } = $props();
	const base = $derived(`/g/${data.gym.id}`);
	let showAdd = $state(page.url.searchParams.get('new') === '1');
</script>

<svelte:head><title>Athletes · {data.gym.name}</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="page-title">Athletes</h1>
		<div class="mt-1 h-5 muted">
			<Streamed promise={data.list}>
				{#snippet skeleton()}<Bone class="h-4 w-20" />{/snippet}
				{#snippet children(list)}{list.athletes.length} athletes{/snippet}
			</Streamed>
		</div>
	</div>
	<button class="btn-primary" onclick={() => (showAdd = !showAdd)}
		>{showAdd ? 'Close' : 'Add athletes'}</button
	>
</div>

<Streamed promise={data.list}>
	{#snippet skeleton()}
		<div class="mt-6 flex flex-wrap gap-3">
			<Bone class="h-9 w-full max-w-xs rounded-lg" />
			<Bone class="h-9 w-32 rounded-lg" />
			<Bone class="h-9 w-32 rounded-lg" />
		</div>
		<div class="mt-4 card">
			<div class="border-b border-slate-200 bg-slate-50/60 px-4 py-3">
				<Bone class="h-3 w-1/2" />
			</div>
			{#each { length: 8 }, i (i)}
				<div class="flex items-center gap-6 border-b border-slate-100 px-4 py-3.5 last:border-0">
					<Bone class="size-4" />
					<Bone class="h-4 {['w-36', 'w-28', 'w-44', 'w-32'][i % 4]}" />
					<Bone class="hidden h-4 w-24 sm:block" />
					<Bone class="hidden h-4 w-16 sm:block" />
					<Bone class="h-2 flex-1" />
				</div>
			{/each}
		</div>
	{/snippet}
	{#snippet children(list)}
		<AthletesView {list} {base} formMessage={form?.message} bind:showAdd />
	{/snippet}
</Streamed>
