<script lang="ts">
	import { navigating, page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';

	let { data, children } = $props();
	let menuOpen = $state(false);

	const base = $derived(`/g/${data.gym.id}`);
	const nav = $derived(
		data.role === 'student'
			? [{ href: `${base}/me`, label: 'My progress', icon: 'star' }]
			: [
					{ href: base, label: 'Dashboard', icon: 'home', exact: true },
					{ href: `${base}/athletes`, label: 'Athletes', icon: 'users' },
					{ href: `${base}/teams`, label: 'Teams', icon: 'flag' },
					{ href: `${base}/curriculum`, label: 'Curriculum', icon: 'list' },
					{ href: `${base}/library`, label: 'Skill library', icon: 'book' },
					...(data.role === 'owner'
						? [
								{ href: `${base}/staff`, label: 'Coaches & staff', icon: 'shield' },
								{ href: `${base}/settings`, label: 'Gym settings', icon: 'cog' }
							]
						: [])
				]
	);

	const icons: Record<string, string> = {
		home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
		users:
			'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6M22 19v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74',
		flag: 'M4 22V4m0 0s1.5-1 5-1 5 2 8 2 3-1 3-1v11s-1 1-3 1-5-2-8-2-5 1-5 1',
		list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
		shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
		cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
		book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
		star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'
	};

	function active(item: { href: string; exact?: boolean }) {
		// Highlight the destination as soon as a navigation starts, not when it finishes.
		const p = navigating.to?.url.pathname ?? page.url.pathname;
		return item.exact ? p === item.href : p === item.href || p.startsWith(item.href + '/');
	}

	$effect(() => {
		void page.url.pathname;
		menuOpen = false;
	});
</script>

<svelte:head><title>{data.gym.name}</title></svelte:head>

<div class="min-h-screen lg:flex">
	<!-- mobile top bar -->
	<div
		class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden"
	>
		<Logo href={base} />
		<button
			class="btn-ghost btn-sm"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Toggle menu"
		>
			<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2"
				><path d="M4 6h16M4 12h16M4 18h16" /></svg
			>
		</button>
	</div>

	<aside
		class="{menuOpen
			? 'block'
			: 'hidden'} border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col"
	>
		<div class="hidden px-5 py-5 lg:block"><Logo href={base} /></div>
		<div class="px-5 pt-3 pb-2 lg:pt-0">
			<p class="truncate text-xs font-semibold tracking-wide text-slate-400 uppercase">
				{data.gym.name}
			</p>
		</div>
		<nav class="flex-1 space-y-0.5 px-3 pb-4" data-sveltekit-preload-code="eager">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					aria-current={active(item) ? 'page' : undefined}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium {active(item)
						? 'bg-indigo-50 text-indigo-700'
						: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
				>
					<svg
						viewBox="0 0 24 24"
						class="size-4.5 shrink-0"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><path d={icons[item.icon]} /></svg
					>
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="border-t border-slate-200 p-4">
			<p class="truncate text-sm font-medium text-slate-900">{data.user?.name}</p>
			<p class="truncate text-xs text-slate-500">
				{data.user?.email} · <span class="capitalize">{data.role}</span>
			</p>
			<div class="mt-3 flex gap-2">
				<a href="/app" class="btn-secondary flex-1 btn-sm">Switch gym</a>
				<form method="POST" action="/logout" class="flex-1">
					<button class="btn-ghost w-full btn-sm">Sign out</button>
				</form>
			</div>
		</div>
	</aside>

	<main class="min-w-0 flex-1">
		<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
			{@render children()}
		</div>
	</main>
</div>
