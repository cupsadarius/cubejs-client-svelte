<script lang="ts">
	import cube from '@cubejs-client/core';
	import type { Snippet } from 'svelte';
	import { setCubeClient } from './context.svelte.js';
	import type { CubeProviderProps } from './types.js';

	interface Props extends CubeProviderProps {
		children: Snippet;
	}

	let { apiToken, apiUrl, options = {}, children }: Props = $props();

	// Create the CubeAPI client - this will update when props change
	const client = $derived.by(() => {
		return cube(apiToken, {
			...options,
			apiUrl
		});
	});

	// Set context synchronously during component initialization
	// This must happen during initialization (not in $effect) so children
	// can access the client on their first render
	setCubeClient(client);
</script>

{@render children()}
