import type { Meta } from '@cubejs-client/core';
import { tryGetCubeClient } from '../context.svelte.js';
import type { CreateMetaOptions, MetaState } from '../types.js';

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
 * ```
 */
export function createCubeMeta(options: CreateMetaOptions = {}): MetaState {
	const { client: clientOverride } = options;

	// Get client from context or use override
	const contextClient = tryGetCubeClient();
	const client = clientOverride ?? contextClient;

	if (!client) {
		throw new Error(
			'No CubeJS client available. Either wrap your component with CubeProvider or pass a client in options.'
		);
	}

	// Reactive state
	let meta = $state<Meta | null>(null);
	let loading = $state(false);
	let error = $state<Error | null>(null);

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

	// Refetch function
	const refetch = async (): Promise<void> => {
		requestVersion++;
		await fetchMeta(requestVersion);
	};

	// Auto-fetch on mount
	$effect(() => {
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
