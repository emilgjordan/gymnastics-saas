import data from './cop-2025-2028.json';

export type CopElement = {
	id: string;
	discipline: 'MAG' | 'WAG';
	apparatus: string;
	group: string | null;
	groupName: string | null;
	code: string;
	/** Letter (A–J) for most apparatus, D-score (e.g. "5.40") for vault. */
	value: string | null;
	description: string;
	names: string[];
	dance?: boolean;
};

export const copMeta = data.meta;
export const copElements = data.elements as CopElement[];

export const copApparatus: Record<'MAG' | 'WAG', string[]> = {
	WAG: ['Vault', 'Uneven Bars', 'Balance Beam', 'Floor Exercise'],
	MAG: ['Floor Exercise', 'Pommel Horse', 'Rings', 'Vault', 'Parallel Bars', 'Horizontal Bar']
};

const byId = new Map(copElements.map((e) => [e.id, e]));
export const getCopElement = (id: string) => byId.get(id);

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

export function valueLabel(e: Pick<CopElement, 'apparatus' | 'value'>) {
	if (!e.value) return '';
	return e.apparatus === 'Vault' ? `D-score ${e.value}` : `Value ${e.value}`;
}
