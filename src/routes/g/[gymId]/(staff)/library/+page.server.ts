import { fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { apparatus as eventTable, level, skill } from '$lib/server/db/schema';
import { getCurriculum } from '$lib/server/athletes';
import {
	copApparatus,
	copElements,
	copMeta,
	getCopElement,
	matchEvent,
	valueLabel
} from '$lib/server/cop';
import { owner } from '$lib/server/guards';
import { str } from '$lib/server/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const discipline = url.searchParams.get('d') === 'MAG' ? 'MAG' : 'WAG';
	const apps = copApparatus[discipline];
	const app = apps.includes(url.searchParams.get('a') ?? '') ? url.searchParams.get('a')! : apps[0];
	const { levels, events, skills } = await getCurriculum(params.gymId);
	const suggested = matchEvent(events, app);
	const existing = new Set(
		skills.map((s) => `${s.levelId}|${s.apparatusId}|${s.name.toLowerCase()}`)
	);

	return {
		discipline,
		apparatus: app,
		apparatusList: apps,
		elements: copElements.filter((e) => e.discipline === discipline && e.apparatus === app),
		source: copMeta.source,
		levels: levels.map((l) => ({ id: l.id, name: l.name })),
		events: events.map((e) => ({ id: e.id, name: e.name })),
		suggestedEventId: suggested?.id ?? null,
		existingKeys: [...existing]
	};
};

export const actions: Actions = {
	add: async (event) => {
		const { gymId } = owner(event);
		const form = await event.request.formData();
		const ids = form.getAll('ids').map(String);
		const elements = ids.map(getCopElement).filter((e) => e !== undefined);
		if (!elements.length) return fail(400, { message: 'Select at least one skill' });
		if (elements.length > 300) return fail(400, { message: 'Add at most 300 skills at a time' });

		const levelId = str(form, 'levelId');
		const [lvl] = await db
			.select({ id: level.id })
			.from(level)
			.where(and(eq(level.id, levelId), eq(level.gymId, gymId)));
		if (!lvl) return fail(400, { message: 'Choose a level' });

		let eventId = str(form, 'eventId');
		if (eventId === 'new') {
			const name = elements[0].apparatus;
			const { events } = await getCurriculum(gymId);
			const found = events.find((e) => e.name.toLowerCase() === name.toLowerCase());
			if (found) eventId = found.id;
			else {
				const [created] = await db
					.insert(eventTable)
					.values({ gymId, name, sortOrder: events.length })
					.returning();
				eventId = created.id;
			}
		} else {
			const [ev] = await db
				.select({ id: eventTable.id })
				.from(eventTable)
				.where(and(eq(eventTable.id, eventId), eq(eventTable.gymId, gymId)));
			if (!ev) return fail(400, { message: 'Choose an event' });
		}

		const current = await db
			.select({ name: skill.name, sortOrder: skill.sortOrder })
			.from(skill)
			.where(and(eq(skill.levelId, levelId), eq(skill.apparatusId, eventId)));
		const names = new Set(current.map((s) => s.name.toLowerCase()));
		let order = current.reduce((m, s) => Math.max(m, s.sortOrder + 1), 0);

		const rows = elements
			.filter((e) => !names.has(e.description.toLowerCase()))
			.map((e) => ({
				gymId,
				levelId,
				apparatusId: eventId,
				name: e.description,
				description: `FIG ${e.discipline} ${e.apparatus} ${e.code} · ${valueLabel(e)}`,
				sortOrder: order++
			}));
		if (rows.length) await db.insert(skill).values(rows);
		return { added: rows.length, skipped: elements.length - rows.length };
	}
};
