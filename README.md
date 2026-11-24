# GymSkills

Skill tracking for gymnastics clubs. Gyms organise athletes into teams, coaches record which skills
each athlete is **working on** or has **mastered**, and athletes log in to follow their own progress.

Built with SvelteKit (Svelte 5), Tailwind CSS 4, Drizzle ORM + PostgreSQL and Better Auth.

## Features

- **Gyms** – anyone can sign up and create a gym. One account can belong to several gyms.
- **Roles**
  - **Owner** – everything, plus editing the curriculum, inviting/removing coaches and gym settings.
  - **Coach** – manage athletes, teams and skill progress; view the curriculum.
  - **Student** – read-only view of their own level, skills, coach notes and history.
- **Curriculum** – each gym has its own ordered **levels**, **events** (floor, beam, bars, vault, …)
  and **skills**. New gyms can start from a built-in Level 1–5 template (`src/lib/server/template.ts`).
- **Athletes** – bulk add (paste a list of names), filter/search, bulk-assign team or level.
- **Skill tracking** – one tap to set _Not started / Working on / Mastered_, optional coach note per
  skill, mastered date, and a full change history.
- **Levels** – coaches set an athlete's level; the app shows progress through it and flags athletes
  who have mastered every skill as **ready to move up** (one-click "Move to next level").
- **Teams** – assign athletes and coaches, see average progress, and use the **skill matrix**
  (athletes × skills grid, click a cell to cycle the status).
- **Invites** – single-use invite links (no email server required):
  - owners create coach/owner invite links on _Coaches & staff_;
  - coaches create a personal login link for an athlete from the athlete's page.
- **Dashboard** – stats, ready-to-move-up list, team progress, recent activity.
- **Skill library** – all ~1,300 elements from the FIG Code of Points 2025–2028 (men's and
  women's, every apparatus) with element group and difficulty value (vault: D-score). Search,
  filter by value or group, and (owners) add selected skills to any level. Data lives in
  `src/lib/server/cop/`; see `scripts/cop/README.md` to regenerate it.

## Getting started (local development)

Requirements: Node 20+ and PostgreSQL (or Docker).

```sh
cp .env.example .env          # then set BETTER_AUTH_SECRET
npm install
npm run db:start              # starts Postgres in Docker (skip if you have your own)
npm run db:migrate            # creates the tables
npm run db:seed               # optional: demo gym with sample data
npm run dev
```

Open http://localhost:5173.

### Demo accounts (after `npm run db:seed`)

All use the password `password123`:

| Email             | Role                   |
| ----------------- | ---------------------- |
| `owner@demo.test` | Owner                  |
| `coach@demo.test` | Coach                  |
| `emma@demo.test`  | Student (athlete Emma) |
| `liam@demo.test`  | Student (athlete Liam) |

Re-running the seed deletes and recreates the demo gym and accounts.

## Scripts

| Command               | What it does                                  |
| --------------------- | --------------------------------------------- |
| `npm run dev`         | Dev server                                    |
| `npm run build`       | Production build (Node adapter → `build/`)    |
| `npm start`           | Run the production build                      |
| `npm run check`       | Type-check                                    |
| `npm run lint`        | Prettier + ESLint                             |
| `npm run db:generate` | Create a migration after changing `schema.ts` |
| `npm run db:migrate`  | Apply migrations                              |
| `npm run db:seed`     | Load demo data                                |
| `npm run db:studio`   | Drizzle Studio DB browser                     |

## Deployment

The app uses `@sveltejs/adapter-node`. Set these environment variables:

- `DATABASE_URL` – Postgres connection string
- `ORIGIN` – public URL, e.g. `https://skills.mygym.com` (used for auth and invite links)
- `BETTER_AUTH_SECRET` – long random string (`openssl rand -base64 32`)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` – optional; enables "Continue with GitHub"

**Docker:** the included `Dockerfile` builds the app and applies migrations on start.

```sh
docker compose --profile app up --build   # app on http://localhost:3000 + Postgres
```

**Without Docker:** `npm ci && npm run build && npm run db:migrate && npm start`.

## Project layout

```
src/
  hooks.server.ts            auth session + gym access control (membership & role checks)
  lib/server/db/schema.ts    database schema
  lib/server/                curriculum template, invites, progress helpers
  lib/components/            SkillBoard, ProgressBar, StatusBadge, …
  routes/
    (auth)/login, signup     authentication
    onboarding/              create a gym or join with an invite
    invite/[token]/          accept an invite
    g/[gymId]/               gym dashboard
    g/[gymId]/me/            athlete's own progress
    g/[gymId]/(staff)/       athletes, teams, curriculum (coaches & owners)
    g/[gymId]/(staff)/(owner)/ staff management, gym settings (owners)
```

Access control lives in `hooks.server.ts`: every `/g/[gymId]/…` request requires membership of that
gym, routes in a `(staff)` group require coach/owner, and routes in an `(owner)` group require owner.
