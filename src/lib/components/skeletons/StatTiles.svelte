<script lang="ts">
	import Bone from './Bone.svelte';
	let { n = 4, class: cls = 'grid-cols-2 lg:grid-cols-4' }: { n?: number; class?: string } =
		$props();
</script>

<div class="grid gap-4 {cls}">
	{#each { length: n }, i (i)}
		<div class="space-y-2 card p-5">
			<Bone class="h-3 w-24" />
			<Bone class="h-8 w-14" />
		</div>
	{/each}
</div>
