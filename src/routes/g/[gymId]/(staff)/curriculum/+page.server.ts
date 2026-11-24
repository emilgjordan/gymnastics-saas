import { error, fail } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { apparatus, level, skill } from '$lib/server/db/schema';
import { getCurriculum } from '$lib/server/athletes';
import { owner } from '$lib/server/guards';
import { str } from '$lib/server/util';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => ({
	curriculum: await getCurriculum(params.gymId)
});

const kinds = { level, event: apparatus, skill } as const;
type Kind = keyof typeof kinds;

function kindOf(form: FormData): Kind {
	const k = str(form, 'kind');
	if (k === 'level' || k === 'event' || k === 'skill') return k;
	error(400, 'Invalid kind');
}

async function siblings(
	gymId: string,
	kind: Kind,
	row?: { levelId?: string; apparatusId?: string }
) {
	if (kind === 'level')
		return db
			.select({ id: level.id })
			.from(level)
			.where(eq(level.gymId, gymId))
			.orderBy(asc(level.sortOrder), asc(level.name));
	if (kind === 'event')
		return db
			.select({ id: apparatus.id })
			.from(apparatus)
			.where(eq(apparatus.gymId, gymId))
			.orderBy(asc(apparatus.sortOrder), asc(apparatus.name));
	return db
		.select({ id: skill.id })
		.from(skill)
		.where(
			and(
				eq(skill.gymId, gymId),
				eq(skill.levelId, row!.levelId!),
				eq(skill.apparatusId, row!.apparatusId!)
			)
		)
		.orderBy(asc(skill.sortOrder), asc(skill.name));
}

async function getRow(gymId: string, kind: Kind, id: string) {
	const t = kinds[kind];
	const [r] = await db
		.select()
		.from(t)
		.where(and(eq(t.id, id), eq(t.gymId, gymId)));
	if (!r) error(404, 'Not found');
	return r as { id: string; levelId?: string; apparatusId?: string };
}

async function setOrder(kind: Kind, ids: string[]) {
	const t = kinds[kind];
	await db.transaction(async (tx) => {
		for (const [i, id] of ids.entries())
			await tx.update(t).set({ sortOrder: i }).where(eq(t.id, id));
	});
}

async function refsValid(gymId: string, levelId: string, apparatusId: string) {
	const [l] = await db
		.select({ id: level.id })
		.from(level)
		.where(and(eq(level.id, levelId), eq(level.gymId, gymId)));
	const [a] = await db
		.select({ id: apparatus.id })
		.from(apparatus)
		.where(and(eq(apparatus.id, apparatusId), eq(apparatus.gymId, gymId)));
	return !!l && !!a;
}

export const actions: Actions = {
	add: async (event) => {
		const { gymId } = owner(event);
		const form = await event.request.formData();
		const kind = kindOf(form);
		const name = str(form, 'name');
		if (!name) return fail(400, { message: 'Name is required' });
		if (kind === 'skill') {
			const levelId = str(form, 'levelId');
			const apparatusId = str(form, 'apparatusId');
			if (!(await refsValid(gymId, levelId, apparatusId)))
				return fail(400, { message: 'Invalid level or event' });
			const n = (await siblings(gymId, 'skill', { levelId, apparatusId })).length;
			await db.insert(skill).values({
				gymId,
				levelId,
				apparatusId,
				name,
				description: str(form, 'description') || null,
				sortOrder: n
			});
		} else {
			const n = (await siblings(gymId, kind)).length;
			await db.insert(kinds[kind]).values({ gymId, name, sortOrder: n });
		}
	},
	update: async (event) => {
		const { gymId } = owner(event);
		const form = await event.request.formData();
		const kind = kindOf(form);
		const row = await getRow(gymId, kind, str(form, 'id'));
		const name = str(form, 'name');
		if (!name) return fail(400, { message: 'Name is required' });
		if (kind === 'skill') {
			const levelId = str(form, 'levelId') || row.levelId!;
			const apparatusId = str(form, 'apparatusId') || row.apparatusId!;
			if (!(await refsValid(gymId, levelId, apparatusId)))
				return fail(400, { message: 'Invalid level or event' });
			const moved = levelId !== row.levelId || apparatusId !== row.apparatusId;
			const sortOrder = moved
				? (await siblings(gymId, 'skill', { levelId, apparatusId })).length
				: undefined;
			await db
				.update(skill)
				.set({
					name,
					description: str(form, 'description') || null,
					levelId,
					apparatusId,
					...(sortOrder !== undefined && { sortOrder })
				})
				.where(eq(skill.id, row.id));
		} else {
			await db.update(kinds[kind]).set({ name }).where(eq(kinds[kind].id, row.id));
		}
	},
	move: async (event) => {
		const { gymId } = owner(event);
		const form = await event.request.formData();
		const kind = kindOf(form);
		const row = await getRow(gymId, kind, str(form, 'id'));
		const ids = (await siblings(gymId, kind, row)).map((r) => r.id);
		const i = ids.indexOf(row.id);
		const j = str(form, 'dir') === 'up' ? i - 1 : i + 1;
		if (j < 0 || j >= ids.length) return;
		[ids[i], ids[j]] = [ids[j], ids[i]];
		await setOrder(kind, ids);
	},
	delete: async (event) => {
		const { gymId } = owner(event);
		const form = await event.request.formData();
		const kind = kindOf(form);
		const row = await getRow(gymId, kind, str(form, 'id'));
		await db.delete(kinds[kind]).where(eq(kinds[kind].id, row.id));
	}
};
