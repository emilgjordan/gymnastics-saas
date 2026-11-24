<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { APP_NAME } from '$lib';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{APP_NAME}</title>
</svelte:head>
{@render children()}
