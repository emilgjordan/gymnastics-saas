<script lang="ts">
	import { navigating } from '$app/state';

	// Thin top bar while a navigation is pending. Hidden for fast navigations (<120ms)
	// so preloaded pages don't flicker.
	let visible = $state(false);

	$effect(() => {
		if (!navigating.to) {
			visible = false;
			return;
		}
		const t = setTimeout(() => (visible = true), 120);
		return () => clearTimeout(t);
	});
</script>

<div
	class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-300 {visible
		? 'opacity-100'
		: 'opacity-0'}"
	role="progressbar"
	aria-hidden={!visible}
	aria-label="Loading page"
>
	{#if visible}<div class="nav-progress h-full bg-indigo-500"></div>{/if}
</div>
