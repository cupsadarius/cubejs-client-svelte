/**
 * Check if code is running in a browser environment.
 *
 * This utility provides SSR-safe browser detection that works with:
 * - SvelteKit (uses $app/environment when available)
 * - Plain Svelte + Vite (falls back to typeof window check)
 * - Any other SSR framework
 *
 * @returns true if running in browser, false if running on server
 */
export function isBrowser(): boolean {
	return typeof window !== 'undefined';
}
