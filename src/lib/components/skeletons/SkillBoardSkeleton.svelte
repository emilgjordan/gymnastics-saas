<script lang="ts">
	import Bone from './Bone.svelte';
	// Mirrors SkillBoard / curriculum: a row of level pills, then 2-column event cards.
	let { pills = 'cards' }: { pills?: 'cards' | 'chips' } = $props();
</script>

<div class="flex gap-2 overflow-hidden pb-2">
	{#each { length: 5 }, i (i)}
		{#if pills === 'cards'}
			<div class="min-w-36 shrink-0 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
				<Bone class="h-4 w-20" />
				<Bone class="h-1.5 w-full" />
				<Bone class="h-3 w-16" />
			</div>
		{:else}
			<Bone class="h-8 w-24 shrink-0 rounded-full" />
		{/if}
	{/each}
</div>
<div class="mt-4 grid gap-4 md:grid-cols-2">
	{#each { length: 4 }, c (c)}
		<section class="card">
			<div class="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
				<Bone class="h-4 w-24" />
			</div>
			<ul class="divide-y divide-slate-100">
				{#each { length: 4 }, r (r)}
					<li class="flex items-center justify-between gap-4 px-4 py-3">
						<Bone class="h-4 {['w-36', 'w-28', 'w-44', 'w-32'][(r + c) % 4]}" />
						<Bone class="h-6 w-28 rounded-lg" />
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
