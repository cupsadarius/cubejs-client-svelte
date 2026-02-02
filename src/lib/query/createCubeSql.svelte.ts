import type { Query, SqlQuery } from '@cubejs-client/core';
import { tryGetCubeClient } from '../context.svelte.js';
import type { CreateSqlOptions } from '../types.js';
import { isBrowser } from '../utils/isBrowser.js';
import { isQueryPresent } from '../utils/isQueryPresent.js';

/**
 * State for SQL queries
 */
export interface SqlState {
	/** The generated SQL query object */
	readonly sql: SqlQuery | null;
	/** Whether the SQL is loading */
	readonly loading: boolean;
	/** Any error that occurred */
	readonly error: Error | null;
	/** Function to refresh the SQL */
	readonly refetch: () => Promise<void>;
}

/**
 * Creates a reactive CubeJS SQL query.
 *
 * Fetches the generated SQL for a given query without executing it.
 * Useful for debugging or displaying the underlying SQL.
 *
 * @param query - The query object or a function that returns a query object
 * @param options - Optional configuration including client override
 * @returns A reactive SqlState object with sql, loading, error, and refetch
 *
 * @example
 * ```svelte
 * <script>
 *   import { createCubeSql } from 'cubejs-client-svelte';
 *
 *   const sqlState = createCubeSql({
 *     measures: ['Orders.count'],
 *     dimensions: ['Orders.status']
 *   });
 * </script>
 *
 * {#if sqlState.loading}
 *   <p>Generating SQL...</p>
 * {:else if sqlState.sql}
 *   <pre>{sqlState.sql.sql()}</pre>
 * {/if}
 * ```
 */
export function createCubeSql(
	query: Query | (() => Query),
	options: CreateSqlOptions = {}
): SqlState {
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
	let sql = $state<SqlQuery | null>(null);
	let loading = $state(false);
	let error = $state<Error | null>(null);

	// Version counter for race condition handling
	let requestVersion = 0;

	// Get the current query value
	const getQuery = (): Query => {
		return typeof query === 'function' ? query() : query;
	};

	// Fetch SQL with version tracking to prevent race conditions
	const fetchSql = async (version: number): Promise<void> => {
		const currentQuery = getQuery();

		// Check if query is empty/invalid using unified validation
		if (!isQueryPresent(currentQuery)) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				sql = null;
				loading = false;
				error = null;
			}
			return;
		}

		loading = true;
		error = null;

		try {
			const result = await client.sql(currentQuery);
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				sql = result;
			}
		} catch (e) {
			// Only update state if this is still the latest request
			if (version === requestVersion) {
				error = e instanceof Error ? e : new Error(String(e));
				sql = null;
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
		await fetchSql(requestVersion);
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
			fetchSql(requestVersion);
		}
	});

	// Return reactive state object
	return {
		get sql() {
			return sql;
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
