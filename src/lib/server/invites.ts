import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from './db';
import { invite, type Role } from './db/schema';

const DAY = 24 * 60 * 60 * 1000;

function token() {
	const bytes = crypto.getRandomValues(new Uint8Array(24));
	return Buffer.from(bytes).toString('base64url');
}

export async function createInvite(opts: {
	gymId: string;
	role: Role;
	createdBy: string;
	athleteId?: string;
	days?: number;
}) {
	// Only one open invite per athlete: revoke older ones.
	if (opts.athleteId) {
		await db.delete(invite).where(and(eq(invite.athleteId, opts.athleteId), isNull(invite.usedAt)));
	}
	const [row] = await db
		.insert(invite)
		.values({
			gymId: opts.gymId,
			role: opts.role,
			athleteId: opts.athleteId ?? null,
			createdBy: opts.createdBy,
			token: token(),
			expiresAt: new Date(Date.now() + (opts.days ?? 14) * DAY)
		})
		.returning();
	return row;
}

export async function findOpenInvite(tok: string) {
	const [row] = await db
		.select()
		.from(invite)
		.where(and(eq(invite.token, tok), isNull(invite.usedAt), gt(invite.expiresAt, new Date())))
		.limit(1);
	return row ?? null;
}
