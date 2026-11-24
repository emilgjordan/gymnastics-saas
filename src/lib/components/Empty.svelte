<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, children }: { title: string; children?: Snippet } = $props();
</script>

<div class="rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-10 text-center">
	<p class="font-medium text-slate-700">{title}</p>
	{#if children}<div class="mt-1 muted">{@render children()}</div>{/if}
</div>
