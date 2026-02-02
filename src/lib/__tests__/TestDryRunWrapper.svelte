<script lang="ts">
	import type { Query } from '@cubejs-client/core';
	import { createDryRun } from '../query/createDryRun.svelte.js';
	import type { CreateDryRunOptions, DryRunState } from '../types.js';

	interface Props {
		query: Query | (() => Query);
		options: CreateDryRunOptions;
		onStateChange?: (state: DryRunState) => void;
	}

	let { query, options, onStateChange }: Props = $props();

	const state = createDryRun(query, options);

	$effect(() => {
		onStateChange?.(state);
	});
</script>

<div data-testid="dryrun-wrapper"></div>
