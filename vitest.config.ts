import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	// @ts-expect-error - vite version mismatch between vitest and @sveltejs/vite-plugin-svelte
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['src/lib/__tests__/setup.ts']
	},
	resolve: {
		conditions: ['browser']
	}
});
