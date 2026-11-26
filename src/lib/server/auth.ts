import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const githubEnabled = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);

// On Vercel, fall back to the project's production URL so ORIGIN doesn't have to be set by hand.
const vercelUrl = (host?: string) => (host ? `https://${host}` : undefined);
const baseURL = env.ORIGIN || vercelUrl(env.VERCEL_PROJECT_PRODUCTION_URL);

export const auth = betterAuth({
	baseURL,
	trustedOrigins: [baseURL, vercelUrl(env.VERCEL_URL), vercelUrl(env.VERCEL_BRANCH_URL)].filter(
		(o): o is string => !!o
	),
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true, minPasswordLength: 8 },
	// Cache the session in a signed cookie so most requests (including hover
	// preloads) don't need a database round-trip to resolve the user.
	session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
	socialProviders: githubEnabled
		? {
				github: {
					clientId: env.GITHUB_CLIENT_ID!,
					clientSecret: env.GITHUB_CLIENT_SECRET!
				}
			}
		: {},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
