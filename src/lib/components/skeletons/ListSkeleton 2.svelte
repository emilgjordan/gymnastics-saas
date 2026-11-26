<script lang="ts">
	import Bone from './Bone.svelte';
	let { rows = 5, title = true }: { rows?: number; title?: boolean } = $props();
</script>

<section class="card">
	{#if title}<div class="border-b border-slate-100 px-4 py-3"><Bone class="h-5 w-32" /></div>{/if}
	<ul class="divide-y divide-slate-100">
		{#each { length: rows }, i (i)}
			<li class="flex items-center gap-4 px-4 py-3.5">
				<div class="flex-1 space-y-1.5">
					<Bone class="h-4 {['w-40', 'w-32', 'w-48', 'w-28', 'w-36'][i % 5]}" />
					<Bone class="h-3 w-20" />
				</div>
				<Bone class="h-2 w-28" />
			</li>
		{/each}
	</ul>
</section>
