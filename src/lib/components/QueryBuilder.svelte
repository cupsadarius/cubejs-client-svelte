<script lang="ts">
	import type { Query } from '@cubejs-client/core';
	import type { Snippet } from 'svelte';
	import { createQueryBuilder } from '../builder/createQueryBuilder.svelte.js';
	import type { CubeApi, ChartType, QueryBuilder as QueryBuilderType } from '../types.js';

	interface Props {
		/** Optional client override */
		client?: CubeApi;
		/** Initial query to populate the builder */
		initialQuery?: Query;
		/** Initial chart type */
		initialChartType?: ChartType;
		/** Snippet to render while metadata is loading */
		loading?: Snippet;
		/** Snippet to render on metadata error, receives the error */
		error?: Snippet<[Error]>;
		/** Snippet to render with the query builder, receives the QueryBuilder instance */
		children: Snippet<[QueryBuilderType]>;
	}

	let {
		client,
		initialQuery,
		initialChartType = 'line',
		loading: loadingSnippet,
		error: errorSnippet,
		children
	}: Props = $props();

	// Create the query builder
	const builder = createQueryBuilder({
		client,
		initialQuery,
		initialChartType
	});
</script>

{#if builder.isMetaLoading}
	{#if loadingSnippet}
		{@render loadingSnippet()}
	{:else}
		<div class="cube-loading">Loading metadata...</div>
	{/if}
{:else if builder.metaError}
	{#if errorSnippet}
		{@render errorSnippet(builder.metaError)}
	{:else}
		<div class="cube-error">Error loading metadata: {builder.metaError.message}</div>
	{/if}
{:else}
	{@render children(builder)}
{/if}
