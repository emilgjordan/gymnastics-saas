import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import { toast } from './toast.svelte';

type Result = ActionResult;

/**
 * Drop-in replacement for a bare `use:enhance` callback:
 * - disables the clicked button while the request is in flight (no double submits)
 * - optional success toast and `onSuccess` hook
 * - `reset: false` keeps input values (default resets like SvelteKit does)
 */
export function submit(
	opts: {
		success?: string | ((result: Result) => string | undefined);
		reset?: boolean;
		onSuccess?: (result: Result) => void;
	} = {}
): SubmitFunction {
	return ({ submitter }) => {
		const btn = submitter instanceof HTMLButtonElement ? submitter : null;
		// FormData (including the submitter's name/value) is already built at this point.
		btn?.setAttribute('disabled', '');
		return async ({ result, update }) => {
			await update({ reset: opts.reset ?? true });
			btn?.removeAttribute('disabled');
			if (result.type === 'success') {
				const msg = typeof opts.success === 'function' ? opts.success(result) : opts.success;
				if (msg) toast(msg);
				opts.onSuccess?.(result);
			} else if (result.type === 'error') {
				toast(result.error?.message ?? 'Something went wrong', 'error');
			}
		};
	};
}
