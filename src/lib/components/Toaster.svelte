<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, dismiss } from '$lib/toast.svelte';
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
	aria-live="polite"
>
	{#each toasts as t (t.id)}
		<button
			type="button"
			in:fly={{ y: 8, duration: 150 }}
			out:fly={{ y: 8, duration: 150 }}
			onclick={() => dismiss(t.id)}
			class="pointer-events-auto flex max-w-sm items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ring-1 {t.kind ===
			'error'
				? 'bg-red-600 text-white ring-red-700'
				: 'bg-slate-900 text-white ring-slate-800'}"
		>
			{#if t.kind === 'success'}<span class="text-emerald-400">✓</span>{:else}<span>!</span>{/if}
			{t.message}
		</button>
	{/each}
</div>
