import type { Query } from '@cubejs-client/core';

/**
 * Check if a query has any meaningful content (measures or dimensions).
 *
 * This is useful for determining whether to execute a query or skip it.
 *
 * @param query - The query to check, can be null or undefined
 * @returns true if the query has at least one measure or dimension
 *
 * @example
 * ```svelte
 * <script>
 *   import { isQueryPresent, createCubeQuery } from 'cubejs-client-svelte';
 *
 *   let measures = $state<string[]>([]);
 *
 *   const query = $derived({
 *     measures,
 *     dimensions: ['Orders.status']
 *   });
 *
 *   // Only execute when query has content
 *   const result = createCubeQuery(() => query, {
 *     skip: !isQueryPresent(query)
 *   });
 * </script>
 * ```
 */
export function isQueryPresent(query: Query | null | undefined): boolean {
	if (!query) {
		return false;
	}

	const hasMeasures = Array.isArray(query.measures) && query.measures.length > 0;
	const hasDimensions = Array.isArray(query.dimensions) && query.dimensions.length > 0;
	const hasTimeDimensions = Array.isArray(query.timeDimensions) && query.timeDimensions.length > 0;

	return hasMeasures || hasDimensions || hasTimeDimensions;
}

export default isQueryPresent;
