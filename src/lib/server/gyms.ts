import { db } from './db';
import { gym, member } from './db/schema';
import { seedCurriculum } from './seedCurriculum';

export async function createGym(opts: {
	name: string;
	ownerUserId: string;
	withTemplate: boolean;
}) {
	return db.transaction(async (tx) => {
		const [g] = await tx.insert(gym).values({ name: opts.name }).returning();
		await tx.insert(member).values({ gymId: g.id, userId: opts.ownerUserId, role: 'owner' });
		if (opts.withTemplate) await seedCurriculum(tx, g.id);
		return g;
	});
}
