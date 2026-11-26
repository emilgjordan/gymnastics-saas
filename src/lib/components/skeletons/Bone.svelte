<script lang="ts">
	// A single grey placeholder block; size it with utility classes.
	let { class: cls = 'h-4 w-full' }: { class?: string } = $props();
</script>

<div class="bone {cls}"></div>
