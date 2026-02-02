<script lang="ts">
	import type { Query } from '@cubejs-client/core';
	import { createCubeSql, type SqlState } from '../query/createCubeSql.svelte.js';
	import type { CreateSqlOptions } from '../types.js';

	interface Props {
		query: Query | (() => Query);
		options: CreateSqlOptions;
		onStateChange?: (state: SqlState) => void;
	}

	let { query, options, onStateChange }: Props = $props();

	const state = createCubeSql(query, options);

	$effect(() => {
		onStateChange?.(state);
	});
</script>

<div data-testid="sql-wrapper"></div>
