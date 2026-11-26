// Client-safe Code of Points helpers (the element data itself stays server-side).

/** Find the gym event that best matches a Code of Points apparatus. */
export function matchEvent<T extends { name: string }>(events: T[], apparatus: string) {
	const patterns: Record<string, RegExp> = {
		'Floor Exercise': /floor/i,
		'Balance Beam': /beam/i,
		'Uneven Bars': /uneven|^bars$/i,
		Vault: /vault/i,
		'Pommel Horse': /pommel/i,
		Rings: /ring/i,
		'Parallel Bars': /parallel|p-?bars/i,
		'Horizontal Bar': /horizontal|high bar/i
	};
	const re = patterns[apparatus];
	return (re && events.find((e) => re.test(e.name))) || null;
}
