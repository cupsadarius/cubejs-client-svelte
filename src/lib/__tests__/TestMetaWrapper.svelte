<script lang="ts">
	import type { CubeApi } from '@cubejs-client/core';
	import { createCubeMeta } from '../query/createCubeMeta.svelte.js';
	import type { CreateMetaOptions, MetaState } from '../types.js';

	interface Props {
		options: CreateMetaOptions;
		onStateChange?: (state: MetaState) => void;
	}

	let { options, onStateChange }: Props = $props();

	const state = createCubeMeta(options);

	// Expose state via callback for testing
	$effect(() => {
		onStateChange?.(state);
	});
</script>

<div data-testid="meta-wrapper">
	<span data-testid="loading">{state.loading}</span>
	<span data-testid="has-meta">{state.meta !== null}</span>
	<span data-testid="has-error">{state.error !== null}</span>
</div>
