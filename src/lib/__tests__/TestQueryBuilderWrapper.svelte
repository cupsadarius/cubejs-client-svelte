<script lang="ts">
	import { createQueryBuilder } from '../builder/createQueryBuilder.svelte.js';
	import type { QueryBuilderOptions, QueryBuilder } from '../types.js';

	interface Props {
		options: QueryBuilderOptions;
		onStateChange?: (state: QueryBuilder) => void;
	}

	let { options, onStateChange }: Props = $props();

	const state = createQueryBuilder(options);

	$effect(() => {
		onStateChange?.(state);
	});
</script>

<div data-testid="querybuilder-wrapper"></div>
