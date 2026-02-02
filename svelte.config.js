import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	},
	package: {
		// Exclude test files from the package
		files: (filepath) => {
			return !filepath.includes('__tests__');
		}
	}
};

export default config;
