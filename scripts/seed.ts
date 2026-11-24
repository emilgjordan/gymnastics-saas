/**
 * Creates a demo gym with an owner, a coach, two athlete logins, teams,
 * athletes and some random progress.
 *
 *   npm run db:seed
 *
 * All demo accounts use the password "password123".
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import * as schema from '../src/lib/server/db/schema';
import { seedCurriculum } from '../src/lib/server/seedCurriculum';

const {
	gym,
	member,
	team,
	teamCoach,
	athlete,
	athleteSkill,
	skillLog,
	level,
	skill,
	user,
	account
} = schema;

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client, { schema });

const PASSWORD = 'password123';
const people = [
	{ key: 'owner', name: 'Olivia Owner', email: 'owner@demo.test' },
	{ key: 'coach', name: 'Carlos Coach', email: 'coach@demo.test' },
	{ key: 'emma', name: 'Emma Johnson', email: 'emma@demo.test' },
	{ key: 'liam', name: 'Liam Chen', email: 'liam@demo.test' }
] as const;

async function main() {
	// wipe previous demo users (cascades to their gyms via membership? no — delete gym explicitly)
	const emails = people.map((p) => p.email);
	const old = await db.select({ id: user.id }).from(user).where(inArray(user.email, emails));
	if (old.length) {
		const ids = old.map((o) => o.id);
		const gyms = await db
			.select({ gymId: member.gymId })
			.from(member)
			.where(inArray(member.userId, ids));
		if (gyms.length)
			await db.delete(gym).where(
				inArray(
					gym.id,
					gyms.map((g) => g.gymId)
				)
			);
		await db.delete(user).where(inArray(user.id, ids));
	}

	const hash = await hashPassword(PASSWORD);
	const uid: Record<string, string> = {};
	for (const p of people) {
		const id = crypto.randomUUID();
		uid[p.key] = id;
		await db.insert(user).values({ id, name: p.name, email: p.email, emailVerified: true });
		await db.insert(account).values({
			id: crypto.randomUUID(),
			accountId: id,
			providerId: 'credential',
			userId: id,
			password: hash
		});
	}

	const [g] = await db.insert(gym).values({ name: 'Riverside Gymnastics (demo)' }).returning();
	await seedCurriculum(db, g.id);

	const [ownerM] = await db
		.insert(member)
		.values({ gymId: g.id, userId: uid.owner, role: 'owner' })
		.returning();
	const [coachM] = await db
		.insert(member)
		.values({ gymId: g.id, userId: uid.coach, role: 'coach' })
		.returning();
	await db.insert(member).values([
		{ gymId: g.id, userId: uid.emma, role: 'student' },
		{ gymId: g.id, userId: uid.liam, role: 'student' }
	]);

	const levels = await db
		.select()
		.from(level)
		.where(eq(level.gymId, g.id))
		.orderBy(level.sortOrder);
	const skills = await db.select().from(skill).where(eq(skill.gymId, g.id));

	const teams = await db
		.insert(team)
		.values([
			{ gymId: g.id, name: 'Girls Level 2', description: 'Mon/Wed 4–6pm' },
			{ gymId: g.id, name: 'Girls Level 4', description: 'Tue/Thu 4–7pm' },
			{ gymId: g.id, name: 'Boys Rec', description: 'Saturdays 9–11am' }
		])
		.returning();
	await db.insert(teamCoach).values([
		{ teamId: teams[0].id, memberId: coachM.id },
		{ teamId: teams[1].id, memberId: ownerM.id },
		{ teamId: teams[2].id, memberId: coachM.id }
	]);

	const roster: { name: string; team: number; level: number; user?: string }[] = [
		{ name: 'Emma Johnson', team: 0, level: 1, user: uid.emma },
		{ name: 'Sofia Martinez', team: 0, level: 1 },
		{ name: 'Ava Williams', team: 0, level: 1 },
		{ name: 'Mia Brown', team: 0, level: 0 },
		{ name: 'Chloe Davis', team: 1, level: 3 },
		{ name: 'Grace Wilson', team: 1, level: 3 },
		{ name: 'Zoe Taylor', team: 1, level: 2 },
		{ name: 'Liam Chen', team: 2, level: 0, user: uid.liam },
		{ name: 'Noah Smith', team: 2, level: 0 },
		{ name: 'Ethan Moore', team: 2, level: 1 }
	];

	let seed = 42;
	const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

	for (const [n, r] of roster.entries()) {
		const [a] = await db
			.insert(athlete)
			.values({
				gymId: g.id,
				name: r.name,
				teamId: teams[r.team].id,
				levelId: levels[r.level].id,
				userId: r.user ?? null,
				birthYear: 2012 + (n % 6)
			})
			.returning();
		for (const sk of skills) {
			const li = levels.findIndex((l) => l.id === sk.levelId);
			let status: 'not_started' | 'working' | 'mastered' | null = null;
			if (li < r.level) status = 'mastered';
			else if (li === r.level) {
				// Sofia has mastered everything → shows "ready to move up"
				const x = n === 1 ? 0 : rand();
				status = x < 0.45 ? 'mastered' : x < 0.75 ? 'working' : null;
			}
			if (!status) continue;
			const daysAgo = Math.floor(rand() * 60);
			const at = new Date(Date.now() - daysAgo * 86400_000);
			await db.insert(athleteSkill).values({
				athleteId: a.id,
				skillId: sk.id,
				status,
				masteredAt: status === 'mastered' ? at : null,
				updatedAt: at,
				updatedBy: uid.coach,
				note:
					status === 'working' && rand() < 0.3
						? 'Getting close — keep practising with a spot'
						: null
			});
			if (li === r.level) {
				await db.insert(skillLog).values({
					gymId: g.id,
					athleteId: a.id,
					skillId: sk.id,
					fromStatus: 'not_started',
					toStatus: status,
					byUserId: uid.coach,
					createdAt: at
				});
			}
		}
	}

	console.log(`Seeded "${g.name}".`);
	console.log(`Sign in with any of: ${emails.join(', ')}  (password: ${PASSWORD})`);
}

main()
	.then(() => client.end())
	.catch(async (e) => {
		console.error(e);
		await client.end();
		process.exit(1);
	});
