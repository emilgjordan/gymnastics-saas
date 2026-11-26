<script lang="ts">
	import Streamed from '$lib/components/Streamed.svelte';
	import Bone from '$lib/components/skeletons/Bone.svelte';
	import StatTiles from '$lib/components/skeletons/StatTiles.svelte';
	import ListSkeleton from '$lib/components/skeletons/ListSkeleton.svelte';
	import DashboardView from './DashboardView.svelte';

	let { data } = $props();
	const base = $derived(`/g/${data.gym.id}`);
</script>

<svelte:head><title>Dashboard · {data.gym.name}</title></svelte:head>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="page-title">Dashboard</h1>
		<p class="mt-1 muted">Welcome back, {data.user?.name?.split(' ')[0]}.</p>
	</div>
	<a href="{base}/athletes?new=1" class="btn-primary">Add athlete</a>
</div>

<Streamed promise={data.dashboard}>
	{#snippet skeleton()}
		<div class="mt-6"><StatTiles /></div>
		<div class="mt-6 grid gap-6 lg:grid-cols-3">
			<div class="space-y-6 lg:col-span-2">
				<ListSkeleton rows={3} />
				<ListSkeleton rows={4} />
			</div>
			<section class="self-start card">
				<div class="border-b border-slate-100 px-4 py-3"><Bone class="h-5 w-32" /></div>
				<div class="space-y-4 p-4">
					{#each { length: 6 }, i (i)}
						<div class="space-y-1.5"><Bone class="h-3.5 w-11/12" /><Bone class="h-3 w-16" /></div>
					{/each}
				</div>
			</section>
		</div>
	{/snippet}
	{#snippet children(d)}
		<DashboardView {d} gymId={data.gym.id} role={data.role} />
	{/snippet}
</Streamed>
