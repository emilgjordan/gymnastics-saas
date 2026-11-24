import type { User, Session } from 'better-auth/minimal';
import type { Role } from '$lib/server/db/schema';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			/** Set for any route under /g/[gymId] */
			gym?: { id: string; name: string };
			membership?: { id: string; role: Role };
		}
	}
}

export {};
