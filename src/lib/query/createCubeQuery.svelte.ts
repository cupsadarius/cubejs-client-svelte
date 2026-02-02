import type { Query, ResultSet } from '@cubejs-client/core';
import { tryGetCubeClient } from '../context.svelte.js';
import type { CreateQueryOptions, QueryState } from '../types.js';
import { isBrowser } from '../utils/isBrowser.js';
import { isQueryPresent } from '../utils/isQueryPresent.js';

/**
 * Creates a reactive CubeJS query.
 *
 * @param query - The query object or a function that returns a query object.
 *                When a function is provided, the query will re-execute when
 *                dependencies change (reactive).
 * @param options - Optional configuration including client override and skip flag
 * @returns A reactive QueryState object with data, loading, error, and refetch
 *
 * @example
 * ```svelte
 * <script>
 *   import { createCubeQuery } from 'cubejs-client-svelte';
 *
 *   // Static query
 *   const result = createCubeQuery({
 *     measures: ['Orders.count'],
 *     dimensions: ['Orders.status']
 *   });
 *
 *   // Reactive query based on state
 *   let selectedMeasure = $state('Orders.count');
 *   const reactiveResult = createCubeQuery(() => ({
 *     measures: [selectedMeasure]
 *   }));
 *
 *   // SSR-safe with initial data from server
 *   export let data; // from +page.server.ts
 *   const ssrResult = createCubeQuery(
 *     { measures: ['Orders.count'] },
 *     { initialData: data.queryResult }
 *   );
 * </script>
 *
 * {#if result.loading}
 *   <p>Loading...</p>
 * {:else if result.error}
 *   <p>Error: {result.error.message}</p>
 * {:else if result.data}
 *   <pre>{JSON.stringify(result.data.tablePivot(), null, 2)}</pre>
 * {/if}
 * ```
 */
export function createCubeQuery(
	query: Query | (() => Query),
	options: CreateQueryOptions = {}
): QueryState {
	const { client: clientOverride, skip = false, ssr = false, initialData, ...loadOptions } = options;

	// Get client from context or use override
	const contextClient = tryGetCubeClient();
	const client = clientOverride ?? contextClient;

	if (!client) {
		throw new Error(
			'No CubeJS client available. Either wrap your component with CubeProvider or pass a client in options.'
		);
	}

	// Reactive state - initialize with initialData if provided
	let data = $state<ResultSet | null>(initialData ?? null);
	let loading = $state(false);
	let error = $state<Error | null>(null);

	// Track if we've had a manual refetch (to allow re-fetching even with initialData)
	let hasRefetched = false;

	// Version counter for race condition handling
	let requestVersion = 0;

	// Get the current query value
	const getQuery = (): Query => {
		return typeof query === 'function' ? query() : query;
	};

	// Execute the query with version tracking to prevent race conditions
	const executeQuery = async (version: number): Promise<void> => {
		const currentQuery = getQuery();

		// Check if query is empty/invalid using unified validation
		if (!isQueryPresent(currentQuery)) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				data = null;
				loading = false;
				error = null;
			}
			return;
		}

		loading = true;
		error = null;

		try {
			const result = await client.load(currentQuery, loadOptions);
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				data = result;
			}
		} catch (e) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				error = e instanceof Error ? e : new Error(String(e));
				data = null;
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
		await executeQuery(requestVersion);
	};

	// Auto-execute query when dependencies change (if query is a function)
	$effect(() => {
		if (skip) {
			data = null;
			loading = false;
			error = null;
			return;
		}

		// Skip on server unless ssr option is true
		if (!isBrowser() && !ssr) {
			return;
		}

		// Skip initial fetch if initialData was provided and we haven't manually refetched
		if (initialData && !hasRefetched) {
			return;
		}

		// Access the query to establish reactive dependencies
		const currentQuery = getQuery();

		// Only execute if we have a valid query
		if (isQueryPresent(currentQuery)) {
			requestVersion++;
			executeQuery(requestVersion);
		}
	});

	// Return reactive state object
	return {
		get data() {
			return data;
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
