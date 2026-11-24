<script lang="ts">
	import { enhance } from '$app/forms';
	import FormError from '$lib/components/FormError.svelte';
	let { data, form } = $props();
</script>

<svelte:head><title>Settings · {data.gym.name}</title></svelte:head>

<h1 class="page-title">Gym settings</h1>

<form
	method="POST"
	action="?/rename"
	use:enhance={() =>
		async ({ update }) =>
			update({ reset: false })}
	class="mt-6 max-w-xl space-y-4 card p-6"
>
	<h2 class="font-semibold">General</h2>
	<FormError message={form?.message} />
	<div>
		<label class="label" for="name">Gym name</label>
		<input class="input" id="name" name="name" value={data.gym.name} required />
	</div>
	<div class="flex items-center justify-end gap-3">
		{#if form?.saved}<span class="text-sm text-emerald-700">Saved</span>{/if}
		<button class="btn-primary">Save</button>
	</div>
</form>

<form method="POST" action="?/delete" class="mt-6 max-w-xl space-y-4 card border-red-200 p-6">
	<h2 class="font-semibold text-red-700">Delete gym</h2>
	<p class="text-sm text-slate-600">
		Permanently deletes this gym with all of its teams, athletes, curriculum and progress history.
		This cannot be undone.
	</p>
	<FormError message={form?.deleteMessage} />
	<div>
		<label class="label" for="confirm"
			>Type <span class="font-semibold">{data.gym.name}</span> to confirm</label
		>
		<input class="input" id="confirm" name="confirm" autocomplete="off" />
	</div>
	<div class="flex justify-end"><button class="btn-danger">Delete this gym</button></div>
</form>
