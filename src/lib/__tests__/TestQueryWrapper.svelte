<script lang="ts">
	import type { Query, CubeApi, ResultSet } from '@cubejs-client/core';
	import { createCubeQuery } from '../query/createCubeQuery.svelte.js';
	import type { CreateQueryOptions, QueryState } from '../types.js';

	interface Props {
		query: Query | (() => Query);
		options: CreateQueryOptions;
		onStateChange?: (state: QueryState) => void;
	}

	let { query, options, onStateChange }: Props = $props();

	const state = createCubeQuery(query, options);

	// Expose state via callback for testing
	$effect(() => {
		onStateChange?.(state);
	});
</script>

<div data-testid="query-wrapper">
	<span data-testid="loading">{state.loading}</span>
	<span data-testid="has-data">{state.data !== null}</span>
	<span data-testid="has-error">{state.error !== null}</span>
</div>
