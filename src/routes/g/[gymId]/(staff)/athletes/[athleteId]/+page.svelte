<script lang="ts">
	import FormError from '$lib/components/FormError.svelte';
	import Streamed from '$lib/components/Streamed.svelte';
	import Bone from '$lib/components/skeletons/Bone.svelte';
	import SkillBoardSkeleton from '$lib/components/skeletons/SkillBoardSkeleton.svelte';
	import AthleteView from './AthleteView.svelte';

	let { data, form } = $props();
	const base = $derived(`/g/${data.gym.id}`);
	let editing = $state(false);
</script>

<svelte:head><title>{data.athlete.name} · {data.gym.name}</title></svelte:head>

<a href="{base}/athletes" class="text-sm text-slate-500 hover:text-slate-700">← Athletes</a>

<div class="mt-2 flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="page-title">{data.athlete.name}</h1>
		<p class="mt-1 muted">
			{#if data.athlete.teamId}<a
					class="hover:text-indigo-600"
					href="{base}/teams/{data.athlete.teamId}">{data.athlete.teamName}</a
				>{:else}No team{/if}
			· {data.athlete.levelName ?? 'No level'}
			{#if data.athlete.birthYear}· Born {data.athlete.birthYear}{/if}
		</p>
	</div>
	<button class="btn-secondary" onclick={() => (editing = !editing)}
		>{editing ? 'Close' : 'Edit details'}</button
	>
</div>

<FormError message={form?.message} />

{#key data.athlete.id}
	<Streamed promise={data.view}>
		{#snippet skeleton()}
			<div class="mt-6 grid gap-4 lg:grid-cols-3">
				<div class="space-y-3 card p-5 lg:col-span-2">
					<Bone class="h-3 w-32" />
					<Bone class="h-8 w-16" />
					<Bone class="h-2.5 w-full" />
				</div>
				<div class="space-y-3 card p-5">
					<Bone class="h-3 w-24" />
					<Bone class="h-4 w-full" />
					<Bone class="h-7 w-32 rounded-lg" />
				</div>
			</div>
			<div class="mt-8 mb-3"><Bone class="h-5 w-16" /></div>
			<SkillBoardSkeleton />
		{/snippet}
		{#snippet children(v)}
			<AthleteView {v} athlete={data.athlete} bind:editing />
		{/snippet}
	</Streamed>
{/key}
