import type { Meta } from '@cubejs-client/core';
import { tryGetCubeClient } from '../context.svelte.js';
import type { CreateMetaOptions, MetaState } from '../types.js';
import { isBrowser } from '../utils/isBrowser.js';

/**
 * Creates a reactive CubeJS metadata query.
 *
 * Fetches cube metadata including available measures, dimensions, and segments.
 * The metadata is automatically fetched on component mount.
 *
 * @param options - Optional configuration including client override
 * @returns A reactive MetaState object with meta, loading, error, and refetch
 *
 * @example
 * ```svelte
 * <script>
 *   import { createCubeMeta } from 'cubejs-client-svelte';
 *
 *   const metaState = createCubeMeta();
 * </script>
 *
 * {#if metaState.loading}
 *   <p>Loading metadata...</p>
 * {:else if metaState.error}
 *   <p>Error: {metaState.error.message}</p>
 * {:else if metaState.meta}
 *   <ul>
 *     {#each metaState.meta.cubes as cube}
 *       <li>{cube.name}: {cube.measures.length} measures</li>
 *     {/each}
 *   </ul>
 * {/if}
 *
 * // SSR-safe with initial metadata from server
 * export let data; // from +page.server.ts
 * const metaState = createCubeMeta({ initialMeta: data.meta });
 * ```
 */
export function createCubeMeta(options: CreateMetaOptions = {}): MetaState {
	const { client: clientOverride, ssr = false, initialMeta } = options;

	// Get client from context or use override
	const contextClient = tryGetCubeClient();
	const client = clientOverride ?? contextClient;

	if (!client) {
		throw new Error(
			'No CubeJS client available. Either wrap your component with CubeProvider or pass a client in options.'
		);
	}

	// Reactive state - initialize with initialMeta if provided
	let meta = $state<Meta | null>(initialMeta ?? null);
	let loading = $state(false);
	let error = $state<Error | null>(null);

	// Track if we've had a manual refetch (to allow re-fetching even with initialMeta)
	let hasRefetched = false;

	// Version counter for race condition handling
	let requestVersion = 0;

	// Fetch metadata with version tracking to prevent race conditions
	const fetchMeta = async (version: number): Promise<void> => {
		loading = true;
		error = null;

		try {
			const result = await client.meta();
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				meta = result;
			}
		} catch (e) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				error = e instanceof Error ? e : new Error(String(e));
				meta = null;
			}
		} finally {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				loading = false;
			}
		}
	};

	// Refetch function - always executes regardless of SSR settings
	const refetch = async (): Promise<void> => {
		hasRefetched = true;
		requestVersion++;
		await fetchMeta(requestVersion);
	};

	// Auto-fetch on mount
	$effect(() => {
		// Skip on server unless ssr option is true
		if (!isBrowser() && !ssr) {
			return;
		}

		// Skip initial fetch if initialMeta was provided and we haven't manually refetched
		if (initialMeta && !hasRefetched) {
			return;
		}

		requestVersion++;
		fetchMeta(requestVersion);
	});

	// Return reactive state object
	return {
		get meta() {
			return meta;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		refetch
	};
}
