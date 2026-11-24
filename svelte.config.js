import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';

// Vercel sets VERCEL=1 during its builds; everywhere else (Docker, `npm start`) use the Node adapter.
const adapter = process.env.VERCEL ? vercelAdapter : nodeAdapter;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// adapter-node only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.

		adapter: adapter(),

		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		}
	}
};

export default config;
