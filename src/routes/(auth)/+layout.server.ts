import { githubEnabled } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({ githubEnabled });
