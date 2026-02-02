import type { Query, ResultSet } from '@cubejs-client/core';
import { tryGetCubeClient } from '../context.svelte.js';
import type { CreateQueryOptions, QueryState } from '../types.js';
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
	const { client: clientOverride, skip = false, ...loadOptions } = options;

	// Get client from context or use override
	const contextClient = tryGetCubeClient();
	const client = clientOverride ?? contextClient;

	if (!client) {
		throw new Error(
			'No CubeJS client available. Either wrap your component with CubeProvider or pass a client in options.'
		);
	}

	// Reactive state
	let data = $state<ResultSet | null>(null);
	let loading = $state(false);
	let error = $state<Error | null>(null);

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

	// Refetch function
	const refetch = async (): Promise<void> => {
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
