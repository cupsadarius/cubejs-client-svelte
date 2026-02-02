<script lang="ts">
	import cube from '@cubejs-client/core';
	import type { Snippet } from 'svelte';
	import { setCubeClientContext, type CubeClientContext } from './context.svelte.js';
	import type { CubeProviderProps } from './types.js';

	interface Props extends CubeProviderProps {
		children: Snippet;
	}

	let { apiToken, apiUrl, options = {}, children }: Props = $props();

	// Create reactive state for the client context
	// This must be created in the component for proper Svelte 5 lifecycle
	const clientContext: CubeClientContext = $state({ current: null });

	// Set context synchronously during component initialization
	// This must happen during initialization (not in $effect) so children
	// can access the context on their first render
	setCubeClientContext(clientContext);

	// Update the client reactively when props change
	$effect(() => {
		clientContext.current = cube(apiToken, {
			...options,
			apiUrl
		});
	});
</script>

{@render children()}
