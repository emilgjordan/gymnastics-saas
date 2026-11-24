<script lang="ts">
	import AuthForm from '$lib/components/AuthForm.svelte';
	let { data, form } = $props();
</script>

<svelte:head><title>Sign up</title></svelte:head>
<AuthForm mode="signup" {form} githubEnabled={data.githubEnabled} />
