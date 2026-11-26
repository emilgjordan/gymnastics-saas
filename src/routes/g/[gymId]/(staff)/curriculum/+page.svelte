<script lang="ts">
	import FormError from '$lib/components/FormError.svelte';
	import Streamed from '$lib/components/Streamed.svelte';
	import SkillBoardSkeleton from '$lib/components/skeletons/SkillBoardSkeleton.svelte';
	import CurriculumView from './CurriculumView.svelte';

	let { data, form } = $props();
	const canEdit = $derived(data.role === 'owner');
	let tab = $state<'skills' | 'structure'>('skills');
</script>

<svelte:head><title>Curriculum · {data.gym.name}</title></svelte:head>

<h1 class="page-title">Curriculum</h1>
<p class="mt-1 muted">
	The levels, events and skills your athletes work through. Need elite skills? Browse the
	<a href="/g/{data.gym.id}/library" class="text-indigo-600 hover:underline">FIG skill library</a>.
	{#if !canEdit}Only gym owners can edit the curriculum.{/if}
</p>

<FormError message={form?.message} />

{#if canEdit}
	<div class="mt-6 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
		<button
			class="rounded-md px-3 py-1.5 font-medium {tab === 'skills'
				? 'bg-white shadow-sm'
				: 'text-slate-600'}"
			onclick={() => (tab = 'skills')}>Skills</button
		>
		<button
			class="rounded-md px-3 py-1.5 font-medium {tab === 'structure'
				? 'bg-white shadow-sm'
				: 'text-slate-600'}"
			onclick={() => (tab = 'structure')}>Levels & events</button
		>
	</div>
{/if}

<Streamed promise={data.curriculum}>
	{#snippet skeleton()}
		<div class="mt-6"><SkillBoardSkeleton pills="chips" /></div>
	{/snippet}
	{#snippet children(curriculum)}
		<CurriculumView {curriculum} {canEdit} bind:tab />
	{/snippet}
</Streamed>
