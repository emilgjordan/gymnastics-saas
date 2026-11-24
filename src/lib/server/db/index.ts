import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const url = env.DATABASE_URL || env.POSTGRES_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// prepare: false keeps this compatible with pooled connections (Neon, Supabase, PgBouncer).
const client = postgres(url, { prepare: false });

export const db = drizzle(client, { schema });
