<script lang="ts">
	import { enhance } from '$app/forms';
	import FormError from '$lib/components/FormError.svelte';
	import Streamed from '$lib/components/Streamed.svelte';
	import Bone from '$lib/components/skeletons/Bone.svelte';
	import ListSkeleton from '$lib/components/skeletons/ListSkeleton.svelte';
	import { submit } from '$lib/forms';
	import TeamView from './TeamView.svelte';

	let { data, form } = $props();
	const base = $derived(`/g/${data.gym.id}`);
	let editing = $state(false);
</script>

<svelte:head><title>{data.team.name} · {data.gym.name}</title></svelte:head>

<a href="{base}/teams" class="text-sm text-slate-500 hover:text-slate-700">← Teams</a>
<div class="mt-2 flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="page-title">{data.team.name}</h1>
		{#if data.team.description}<p class="mt-1 muted">{data.team.description}</p>{/if}
	</div>
	<button class="btn-secondary" onclick={() => (editing = !editing)}
		>{editing ? 'Close' : 'Edit team'}</button
	>
</div>

<FormError message={form?.message} />

{#if editing}
	<form
		method="POST"
		action="?/update"
		use:enhance={submit({
			reset: false,
			success: 'Team saved',
			onSuccess: () => (editing = false)
		})}
		class="mt-4 grid gap-4 card p-5 sm:grid-cols-2"
	>
		<div>
			<label class="label" for="name">Name</label>
			<input class="input" id="name" name="name" value={data.team.name} required />
		</div>
		<div>
			<label class="label" for="description">Description</label>
			<input
				class="input"
				id="description"
				name="description"
				value={data.team.description ?? ''}
			/>
		</div>
		<div class="flex justify-between sm:col-span-2">
			<button
				class="btn-danger"
				formaction="?/delete"
				onclick={(e) => {
					if (!confirm('Delete this team? Athletes will be kept but unassigned.'))
						e.preventDefault();
				}}>Delete team</button
			>
			<button class="btn-primary">Save</button>
		</div>
	</form>
{/if}

{#key data.team.id}
	<Streamed promise={data.view}>
		{#snippet skeleton()}
			<div class="mt-6 grid gap-6 lg:grid-cols-3">
				<div class="lg:col-span-2"><ListSkeleton rows={6} /></div>
				<ListSkeleton rows={2} />
			</div>
			<div class="mt-8 space-y-2"><Bone class="h-5 w-28" /><Bone class="h-4 w-72" /></div>
			<div class="mt-4 card p-4">
				<div class="grid grid-cols-8 gap-1.5">
					{#each { length: 40 }, i (i)}<Bone class="h-9 rounded" />{/each}
				</div>
			</div>
		{/snippet}
		{#snippet children(v)}
			<TeamView {v} {base} teamId={data.team.id} />
		{/snippet}
	</Streamed>
{/key}
