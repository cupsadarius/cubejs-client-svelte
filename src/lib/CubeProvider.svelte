<script lang="ts">
	import cube from '@cubejs-client/core';
	import type { Snippet } from 'svelte';
	import { createCubeClientContext } from './context.svelte.js';
	import type { CubeProviderProps } from './types.js';

	interface Props extends CubeProviderProps {
		children: Snippet;
	}

	let { apiToken, apiUrl, options = {}, children }: Props = $props();

	// Create context synchronously during component initialization
	// This must happen during initialization (not in $effect) so children
	// can access the context on their first render
	const clientContext = createCubeClientContext();

	// Update the client reactively when props change
	$effect(() => {
		clientContext.current = cube(apiToken, {
			...options,
			apiUrl
		});
	});
</script>

{@render children()}
