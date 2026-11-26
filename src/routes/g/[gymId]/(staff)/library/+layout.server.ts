import { getCurriculum } from '$lib/server/athletes';
import type { LayoutServerLoad } from './$types';

// Lives in a layout (not the page) because it doesn't depend on the URL: switching
// discipline/apparatus tabs reuses it instead of re-querying the curriculum.
// Streamed, so it never blocks navigation; it re-runs after the "add" action.
export const load: LayoutServerLoad = ({ params }) => ({
	libraryCurriculum: getCurriculum(params.gymId).then(({ levels, events, skills }) => ({
		levels,
		events,
		existingKeys: skills.map((s) => `${s.levelId}|${s.apparatusId}|${s.name.toLowerCase()}`)
	}))
});
