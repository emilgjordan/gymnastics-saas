import { relations } from 'drizzle-orm';
import {
	pgTable,
	text,
	integer,
	timestamp,
	pgEnum,
	primaryKey,
	uniqueIndex,
	index
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp('created_at').defaultNow().notNull();

export const roleEnum = pgEnum('member_role', ['owner', 'coach', 'student']);
export const skillStatusEnum = pgEnum('skill_status', ['not_started', 'working', 'mastered']);

export type Role = (typeof roleEnum.enumValues)[number];
export type SkillStatus = (typeof skillStatusEnum.enumValues)[number];

export const gym = pgTable('gym', {
	id: id(),
	name: text('name').notNull(),
	createdAt: createdAt()
});

export const member = pgTable(
	'member',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: roleEnum('role').notNull(),
		createdAt: createdAt()
	},
	(t) => [
		uniqueIndex('member_gym_user_idx').on(t.gymId, t.userId),
		index('member_user_idx').on(t.userId)
	]
);

export const level = pgTable(
	'level',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [index('level_gym_idx').on(t.gymId)]
);

export const apparatus = pgTable(
	'apparatus',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [index('apparatus_gym_idx').on(t.gymId)]
);

export const skill = pgTable(
	'skill',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		levelId: text('level_id')
			.notNull()
			.references(() => level.id, { onDelete: 'cascade' }),
		apparatusId: text('apparatus_id')
			.notNull()
			.references(() => apparatus.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(t) => [index('skill_gym_idx').on(t.gymId), index('skill_level_idx').on(t.levelId)]
);

export const team = pgTable(
	'team',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		createdAt: createdAt()
	},
	(t) => [index('team_gym_idx').on(t.gymId)]
);

export const teamCoach = pgTable(
	'team_coach',
	{
		teamId: text('team_id')
			.notNull()
			.references(() => team.id, { onDelete: 'cascade' }),
		memberId: text('member_id')
			.notNull()
			.references(() => member.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.teamId, t.memberId] })]
);

export const athlete = pgTable(
	'athlete',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		birthYear: integer('birth_year'),
		teamId: text('team_id').references(() => team.id, { onDelete: 'set null' }),
		levelId: text('level_id').references(() => level.id, { onDelete: 'set null' }),
		/** Login linked to this athlete once they accept an invite. */
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		notes: text('notes'),
		createdAt: createdAt()
	},
	(t) => [index('athlete_gym_idx').on(t.gymId), index('athlete_user_idx').on(t.userId)]
);

export const athleteSkill = pgTable(
	'athlete_skill',
	{
		athleteId: text('athlete_id')
			.notNull()
			.references(() => athlete.id, { onDelete: 'cascade' }),
		skillId: text('skill_id')
			.notNull()
			.references(() => skill.id, { onDelete: 'cascade' }),
		status: skillStatusEnum('status').notNull().default('not_started'),
		note: text('note'),
		masteredAt: timestamp('mastered_at'),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		updatedBy: text('updated_by').references(() => user.id, { onDelete: 'set null' })
	},
	(t) => [primaryKey({ columns: [t.athleteId, t.skillId] })]
);

export const skillLog = pgTable(
	'skill_log',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		athleteId: text('athlete_id')
			.notNull()
			.references(() => athlete.id, { onDelete: 'cascade' }),
		skillId: text('skill_id')
			.notNull()
			.references(() => skill.id, { onDelete: 'cascade' }),
		fromStatus: skillStatusEnum('from_status').notNull(),
		toStatus: skillStatusEnum('to_status').notNull(),
		byUserId: text('by_user_id').references(() => user.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(t) => [
		index('skill_log_gym_idx').on(t.gymId, t.createdAt),
		index('skill_log_athlete_idx').on(t.athleteId)
	]
);

export const invite = pgTable(
	'invite',
	{
		id: id(),
		gymId: text('gym_id')
			.notNull()
			.references(() => gym.id, { onDelete: 'cascade' }),
		token: text('token').notNull().unique(),
		role: roleEnum('role').notNull(),
		athleteId: text('athlete_id').references(() => athlete.id, { onDelete: 'cascade' }),
		createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
		expiresAt: timestamp('expires_at').notNull(),
		usedAt: timestamp('used_at'),
		usedBy: text('used_by').references(() => user.id, { onDelete: 'set null' }),
		createdAt: createdAt()
	},
	(t) => [index('invite_gym_idx').on(t.gymId)]
);

// ---------- relations ----------

export const gymRelations = relations(gym, ({ many }) => ({
	members: many(member),
	levels: many(level),
	apparatus: many(apparatus),
	skills: many(skill),
	teams: many(team),
	athletes: many(athlete)
}));

export const memberRelations = relations(member, ({ one, many }) => ({
	gym: one(gym, { fields: [member.gymId], references: [gym.id] }),
	user: one(user, { fields: [member.userId], references: [user.id] }),
	teams: many(teamCoach)
}));

export const levelRelations = relations(level, ({ one, many }) => ({
	gym: one(gym, { fields: [level.gymId], references: [gym.id] }),
	skills: many(skill)
}));

export const apparatusRelations = relations(apparatus, ({ one, many }) => ({
	gym: one(gym, { fields: [apparatus.gymId], references: [gym.id] }),
	skills: many(skill)
}));

export const skillRelations = relations(skill, ({ one }) => ({
	gym: one(gym, { fields: [skill.gymId], references: [gym.id] }),
	level: one(level, { fields: [skill.levelId], references: [level.id] }),
	apparatus: one(apparatus, { fields: [skill.apparatusId], references: [apparatus.id] })
}));

export const teamRelations = relations(team, ({ one, many }) => ({
	gym: one(gym, { fields: [team.gymId], references: [gym.id] }),
	coaches: many(teamCoach),
	athletes: many(athlete)
}));

export const teamCoachRelations = relations(teamCoach, ({ one }) => ({
	team: one(team, { fields: [teamCoach.teamId], references: [team.id] }),
	member: one(member, { fields: [teamCoach.memberId], references: [member.id] })
}));

export const athleteRelations = relations(athlete, ({ one, many }) => ({
	gym: one(gym, { fields: [athlete.gymId], references: [gym.id] }),
	team: one(team, { fields: [athlete.teamId], references: [team.id] }),
	level: one(level, { fields: [athlete.levelId], references: [level.id] }),
	user: one(user, { fields: [athlete.userId], references: [user.id] }),
	skills: many(athleteSkill)
}));

export const athleteSkillRelations = relations(athleteSkill, ({ one }) => ({
	athlete: one(athlete, { fields: [athleteSkill.athleteId], references: [athlete.id] }),
	skill: one(skill, { fields: [athleteSkill.skillId], references: [skill.id] })
}));

export const skillLogRelations = relations(skillLog, ({ one }) => ({
	athlete: one(athlete, { fields: [skillLog.athleteId], references: [athlete.id] }),
	skill: one(skill, { fields: [skillLog.skillId], references: [skill.id] }),
	by: one(user, { fields: [skillLog.byUserId], references: [user.id] })
}));

export * from './auth.schema';
