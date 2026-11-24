<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	let { children } = $props();
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4 py-12"
>
	<div class="mb-8"><Logo /></div>
	<div class="w-full max-w-sm card p-8">
		{@render children()}
	</div>
</div>
