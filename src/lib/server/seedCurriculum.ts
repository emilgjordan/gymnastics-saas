// No $lib / $env imports here so this can be used from scripts/seed.ts too.
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { apparatus, level, skill } from './db/schema';
import { starterEvents, starterLevels } from './template';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<PgQueryResultHKT, any>;

export async function seedCurriculum(tx: Db, gymId: string) {
	const events = await tx
		.insert(apparatus)
		.values(starterEvents.map((name, i) => ({ gymId, name, sortOrder: i })))
		.returning();
	const eventId = Object.fromEntries(events.map((e) => [e.name, e.id]));

	for (const [i, lvl] of starterLevels.entries()) {
		const [l] = await tx.insert(level).values({ gymId, name: lvl.name, sortOrder: i }).returning();
		const rows = Object.entries(lvl.skills).flatMap(([event, names]) =>
			(names ?? []).map((name, j) => ({
				gymId,
				levelId: l.id,
				apparatusId: eventId[event],
				name,
				sortOrder: j
			}))
		);
		if (rows.length) await tx.insert(skill).values(rows);
	}
}
