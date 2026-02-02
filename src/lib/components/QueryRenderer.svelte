<script lang="ts">
	import type { Query, ResultSet, LoadMethodOptions } from '@cubejs-client/core';
	import type { Snippet } from 'svelte';
	import { createCubeQuery } from '../query/createCubeQuery.svelte.js';
	import type { CubeApi } from '../types.js';

	interface Props {
		/** The query to execute */
		query: Query | (() => Query);
		/** Optional load method options */
		options?: LoadMethodOptions;
		/** Optional client override */
		client?: CubeApi;
		/** Skip executing the query */
		skip?: boolean;
		/** Snippet to render while loading */
		loading?: Snippet;
		/** Snippet to render on error, receives the error */
		error?: Snippet<[Error]>;
		/** Snippet to render with data, receives the ResultSet */
		children: Snippet<[ResultSet]>;
	}

	let {
		query,
		options = {},
		client,
		skip = false,
		loading: loadingSnippet,
		error: errorSnippet,
		children
	}: Props = $props();

	// Wrap query in a function to maintain reactivity when props change
	const getQuery = (): Query => {
		return typeof query === 'function' ? query() : query;
	};

	// Create the query state with reactive query getter
	const queryState = createCubeQuery(getQuery, {
		...options,
		client,
		skip
	});
</script>

{#if queryState.loading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<div class="cube-loading">Loading...</div>
	{/if}
{:else if queryState.error}
	{#if errorSnippet}
		{@render errorSnippet(queryState.error)}
	{:else}
		<div class="cube-error">Error: {queryState.error.message}</div>
	{/if}
{:else if queryState.data}
	{@render children(queryState.data)}
{/if}
