import type { Query, DryRunResponse } from '@cubejs-client/core';
import { tryGetCubeClient } from '../context.svelte.js';
import type { CreateDryRunOptions, DryRunState, LazyDryRunState } from '../types.js';
import { isBrowser } from '../utils/isBrowser.js';
import { isQueryPresent } from '../utils/isQueryPresent.js';

/**
 * Creates a reactive CubeJS dry run query.
 *
 * Dry run validates a query and returns normalization information without
 * actually executing the query against the database.
 *
 * @param query - The query object or a function that returns a query object
 * @param options - Optional configuration including client override
 * @returns A reactive DryRunState object with result, loading, error, and refetch
 *
 * @example
 * ```svelte
 * <script>
 *   import { createDryRun } from 'cubejs-client-svelte';
 *
 *   const dryRunState = createDryRun({
 *     measures: ['Orders.count'],
 *     dimensions: ['Orders.status']
 *   });
 * </script>
 *
 * {#if dryRunState.loading}
 *   <p>Validating query...</p>
 * {:else if dryRunState.result}
 *   <p>Query type: {dryRunState.result.queryType}</p>
 * {/if}
 * ```
 */
export function createDryRun(
	query: Query | (() => Query),
	options: CreateDryRunOptions = {}
): DryRunState {
	const { client: clientOverride, ssr = false } = options;

	// Get client from context or use override
	const contextClient = tryGetCubeClient();
	const client = clientOverride ?? contextClient;

	if (!client) {
		throw new Error(
			'No CubeJS client available. Either wrap your component with CubeProvider or pass a client in options.'
		);
	}

	// Reactive state
	let result = $state<DryRunResponse | null>(null);
	let loading = $state(false);
	let error = $state<Error | null>(null);

	// Version counter for race condition handling
	let requestVersion = 0;

	// Get the current query value
	const getQuery = (): Query => {
		return typeof query === 'function' ? query() : query;
	};

	// Execute dry run with version tracking to prevent race conditions
	const executeDryRun = async (version: number): Promise<void> => {
		const currentQuery = getQuery();

		// Check if query is empty/invalid using unified validation
		if (!isQueryPresent(currentQuery)) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				result = null;
				loading = false;
				error = null;
			}
			return;
		}

		loading = true;
		error = null;

		try {
			const dryRunResult = await client.dryRun(currentQuery);
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				result = dryRunResult;
			}
		} catch (e) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				error = e instanceof Error ? e : new Error(String(e));
				result = null;
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
		await executeDryRun(requestVersion);
	};

	// Auto-execute when dependencies change
	$effect(() => {
		// Skip on server unless ssr option is true
		if (!isBrowser() && !ssr) {
			return;
		}

		const currentQuery = getQuery();
		if (isQueryPresent(currentQuery)) {
			requestVersion++;
			executeDryRun(requestVersion);
		}
	});

	// Return reactive state object
	return {
		get result() {
			return result;
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

/**
 * Creates a lazy CubeJS dry run query that must be manually triggered.
 *
 * Unlike createDryRun, this version doesn't automatically execute.
 * Call the `run()` method to validate a query.
 *
 * @param options - Optional configuration including client override
 * @returns A reactive LazyDryRunState object with result, loading, error, refetch, and run
 *
 * @example
 * ```svelte
 * <script>
 *   import { createLazyDryRun } from 'cubejs-client-svelte';
 *
 *   const dryRunState = createLazyDryRun();
 *
 *   async function validateQuery() {
 *     await dryRunState.run({
 *       measures: ['Orders.count'],
 *       dimensions: ['Orders.status']
 *     });
 *   }
 * </script>
 *
 * <button onclick={validateQuery}>Validate Query</button>
 *
 * {#if dryRunState.result}
 *   <p>Query is valid! Type: {dryRunState.result.queryType}</p>
 * {/if}
 * ```
 */
export function createLazyDryRun(options: CreateDryRunOptions = {}): LazyDryRunState {
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
	let result = $state<DryRunResponse | null>(null);
	let loading = $state(false);
	let error = $state<Error | null>(null);
	let lastQuery = $state<Query | null>(null);

	// Version counter for race condition handling
	let requestVersion = 0;

	// Execute dry run with a specific query and version tracking
	const run = async (query: Query): Promise<void> => {
		lastQuery = query;
		requestVersion++;
		const version = requestVersion;

		// Check if query is empty/invalid using unified validation
		if (!isQueryPresent(query)) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				result = null;
				loading = false;
				error = null;
			}
			return;
		}

		loading = true;
		error = null;

		try {
			const dryRunResult = await client.dryRun(query);
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				result = dryRunResult;
			}
		} catch (e) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				error = e instanceof Error ? e : new Error(String(e));
				result = null;
			}
		} finally {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				loading = false;
			}
		}
	};

	// Refetch with the last query
	const refetch = async (): Promise<void> => {
		if (lastQuery) {
			await run(lastQuery);
		}
	};

	// Return reactive state object
	return {
		get result() {
			return result;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		refetch,
		run
	};
}
