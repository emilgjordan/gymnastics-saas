<script lang="ts">
	import '@fontsource-variable/inter/wght.css';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { APP_NAME } from '$lib';
	import NavProgress from '$lib/components/NavProgress.svelte';
	import Toaster from '$lib/components/Toaster.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{APP_NAME}</title>
</svelte:head>
<NavProgress />
{@render children()}
<Toaster />
