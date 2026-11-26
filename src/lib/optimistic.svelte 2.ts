import { applyAction } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';
import { untrack } from 'svelte';
import { toast } from './toast.svelte';

/**
 * Optimistic overrides for rapid-fire form actions (status toggles, reordering).
 *
 * The UI applies the new value immediately, the action runs without reloading the page,
 * and a single debounced `invalidateAll()` reconciles with the server once the user
 * stops clicking. Overrides are dropped when fresh server data arrives (tracked through
 * `source`), or reverted if the action fails.
 *
 * Must be created during component initialisation.
 */
export function createOptimistic<V>(source: () => unknown, delay = 700) {
	let overrides = $state<Record<string, V>>({});
	let inflight = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect.pre(() => {
		source();
		untrack(() => {
			if (inflight === 0 && Object.keys(overrides).length) overrides = {};
		});
	});
	$effect(() => () => clearTimeout(timer));

	function refresh() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (inflight > 0) refresh();
			else invalidateAll();
		}, delay);
	}

	return {
		get overrides() {
			return overrides;
		},
		get(key: string): V | undefined {
			return overrides[key];
		},
		/** `use:enhance={opt.enhance(key, (formData) => newValue)}` */
		enhance(key: string, next: (data: FormData) => V): SubmitFunction {
			return ({ formData }) => {
				const had = key in overrides;
				const prev = overrides[key];
				overrides[key] = next(formData);
				inflight++;
				clearTimeout(timer);
				return async ({ result }) => {
					inflight--;
					if (result.type === 'success') return refresh();
					if (had) overrides[key] = prev;
					else delete overrides[key];
					if (result.type === 'redirect') return applyAction(result);
					toast(
						result.type === 'failure'
							? String(result.data?.message ?? 'Could not save that change')
							: 'Could not save that change',
						'error'
					);
				};
			};
		}
	};
}
