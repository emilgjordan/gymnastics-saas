<script lang="ts">
	import AuthForm from '$lib/components/AuthForm.svelte';
	let { data, form } = $props();
</script>

<svelte:head><title>Sign in</title></svelte:head>
<AuthForm mode="login" {form} githubEnabled={data.githubEnabled} />
