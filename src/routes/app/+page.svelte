<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	let { data } = $props();
</script>

<div class="mx-auto max-w-lg px-4 py-16">
	<div class="mb-8 flex items-center justify-between">
		<Logo href="/app" />
		<form method="POST" action="/logout"><button class="btn-ghost btn-sm">Sign out</button></form>
	</div>
	<h1 class="page-title">Choose a gym</h1>
	<ul class="mt-6 divide-y divide-slate-100 card">
		{#each data.gyms as g (g.id)}
			<li>
				<a href="/g/{g.id}" class="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
					<span class="font-medium">{g.name}</span>
					<span class="text-xs text-slate-500 capitalize">{g.role}</span>
				</a>
			</li>
		{/each}
	</ul>
	<a href="/onboarding" class="mt-6 btn-secondary">Create another gym</a>
</div>
