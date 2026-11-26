<script lang="ts">
	import Streamed from '$lib/components/Streamed.svelte';
	import Bone from '$lib/components/skeletons/Bone.svelte';
	import StatTiles from '$lib/components/skeletons/StatTiles.svelte';
	import SkillBoardSkeleton from '$lib/components/skeletons/SkillBoardSkeleton.svelte';
	import MeView from './MeView.svelte';

	let { data } = $props();
</script>

<svelte:head><title>My progress · {data.gym.name}</title></svelte:head>

<Streamed promise={data.me}>
	{#snippet skeleton()}
		<div class="space-y-2"><Bone class="h-7 w-48" /><Bone class="h-4 w-40" /></div>
		<div class="mt-6"><StatTiles n={2} class="md:grid-cols-[2fr_1fr]" /></div>
		<div class="mt-8 mb-3"><Bone class="h-5 w-20" /></div>
		<SkillBoardSkeleton />
	{/snippet}
	{#snippet children(me)}
		<MeView {me} />
	{/snippet}
</Streamed>
