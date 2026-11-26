<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	/**
	 * Renders streamed load data without blocking navigation.
	 * - shows `skeleton` until the first value arrives
	 * - while a *newer* promise is pending (e.g. after a form action), keeps showing the
	 *   previous value instead of flashing the skeleton
	 * Wrap in `{#key}` when the same page component is reused for a different entity.
	 */
	let {
		promise,
		skeleton,
		children
	}: { promise: Promise<T> | T; skeleton: Snippet; children: Snippet<[T]> } = $props();

	let value = $state<{ v: T } | null>(null);
	let failed = $state<string | null>(null);
	let retrying = $state(false);

	$effect(() => {
		const p = promise;
		let live = true;
		Promise.resolve(p).then(
			(v) => {
				if (!live) return;
				value = { v };
				failed = null;
			},
			(e: unknown) => {
				if (!live) return;
				failed = (e as { message?: string })?.message ?? 'Something went wrong';
			}
		);
		return () => {
			live = false;
		};
	});

	async function retry() {
		retrying = true;
		await invalidateAll();
		retrying = false;
	}
</script>

{#if failed && !value}
	<div class="mt-6 card p-6 text-center" role="alert">
		<p class="font-medium text-slate-900">This page couldn't load.</p>
		<p class="mt-1 muted">{failed}</p>
		<button class="mt-4 btn-secondary btn-sm" onclick={retry} disabled={retrying}>
			{retrying ? 'Retrying…' : 'Try again'}
		</button>
	</div>
{:else if value}
	{@render children(value.v)}
{:else}
	<div class="skeleton-in" aria-busy="true" aria-live="polite">
		<span class="sr-only">Loading…</span>
		{@render skeleton()}
	</div>
{/if}
