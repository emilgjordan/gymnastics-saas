/**
 * Tracks the most recent resolved value of a (possibly changing) promise.
 * While a newer promise is pending the previous value stays available, so
 * revalidation after form actions never blanks the UI.
 * Must be created during component initialisation.
 */
export function latest<T>(get: () => Promise<T> | T) {
	let value = $state<{ v: T } | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		const p = get();
		let live = true;
		Promise.resolve(p).then(
			(v) => {
				if (!live) return;
				value = { v };
				error = null;
			},
			(e: unknown) => {
				if (!live) return;
				error = (e as { message?: string })?.message ?? 'Something went wrong';
			}
		);
		return () => {
			live = false;
		};
	});

	return {
		/** `{ v }` once resolved, else null */
		get value() {
			return value;
		},
		get error() {
			return error;
		}
	};
}
