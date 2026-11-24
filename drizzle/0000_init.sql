CREATE TYPE "public"."member_role" AS ENUM('owner', 'coach', 'student');--> statement-breakpoint
CREATE TYPE "public"."skill_status" AS ENUM('not_started', 'working', 'mastered');--> statement-breakpoint
CREATE TABLE "apparatus" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"name" text NOT NULL,
	"birth_year" integer,
	"team_id" text,
	"level_id" text,
	"user_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_skill" (
	"athlete_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"status" "skill_status" DEFAULT 'not_started' NOT NULL,
	"note" text,
	"mastered_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "athlete_skill_athlete_id_skill_id_pk" PRIMARY KEY("athlete_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "gym" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"token" text NOT NULL,
	"role" "member_role" NOT NULL,
	"athlete_id" text,
	"created_by" text,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "level" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"level_id" text NOT NULL,
	"apparatus_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_log" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"athlete_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"from_status" "skill_status" NOT NULL,
	"to_status" "skill_status" NOT NULL,
	"by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"gym_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_coach" (
	"team_id" text NOT NULL,
	"member_id" text NOT NULL,
	CONSTRAINT "team_coach_team_id_member_id_pk" PRIMARY KEY("team_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apparatus" ADD CONSTRAINT "apparatus_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_level_id_level_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."level"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_skill" ADD CONSTRAINT "athlete_skill_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_skill" ADD CONSTRAINT "athlete_skill_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_skill" ADD CONSTRAINT "athlete_skill_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level" ADD CONSTRAINT "level_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_level_id_level_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."level"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_apparatus_id_apparatus_id_fk" FOREIGN KEY ("apparatus_id") REFERENCES "public"."apparatus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_log" ADD CONSTRAINT "skill_log_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_log" ADD CONSTRAINT "skill_log_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_log" ADD CONSTRAINT "skill_log_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_log" ADD CONSTRAINT "skill_log_by_user_id_user_id_fk" FOREIGN KEY ("by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_gym_id_gym_id_fk" FOREIGN KEY ("gym_id") REFERENCES "public"."gym"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_coach" ADD CONSTRAINT "team_coach_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_coach" ADD CONSTRAINT "team_coach_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "apparatus_gym_idx" ON "apparatus" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "athlete_gym_idx" ON "athlete" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "athlete_user_idx" ON "athlete" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invite_gym_idx" ON "invite" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "level_gym_idx" ON "level" USING btree ("gym_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_gym_user_idx" ON "member" USING btree ("gym_id","user_id");--> statement-breakpoint
CREATE INDEX "member_user_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "skill_gym_idx" ON "skill" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "skill_level_idx" ON "skill" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX "skill_log_gym_idx" ON "skill_log" USING btree ("gym_id","created_at");--> statement-breakpoint
CREATE INDEX "skill_log_athlete_idx" ON "skill_log" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX "team_gym_idx" ON "team" USING btree ("gym_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");