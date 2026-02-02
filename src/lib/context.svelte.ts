import { getContext, setContext } from 'svelte';
import type { CubeApi } from '@cubejs-client/core';

const CUBE_CLIENT_KEY = Symbol('cube-client');

/**
 * Set the CubeJS client in the component context.
 * Call this in a parent component to make the client available to all children.
 *
 * @param client - The CubeApi instance to set in context
 */
export function setCubeClient(client: CubeApi): void {
	setContext(CUBE_CLIENT_KEY, client);
}

/**
 * Get the CubeJS client from the component context.
 * Must be called within a component that has CubeProvider as an ancestor,
 * or after setCubeClient has been called in an ancestor component.
 *
 * @returns The CubeApi instance from context
 * @throws Error if no client is found in context
 */
export function getCubeClient(): CubeApi {
	const client = getContext<CubeApi | undefined>(CUBE_CLIENT_KEY);

	if (!client) {
		throw new Error(
			'No CubeJS client found in context. ' +
				'Make sure to wrap your component tree with CubeProvider or call setCubeClient.'
		);
	}

	return client;
}

/**
 * Try to get the CubeJS client from context without throwing.
 * Returns undefined if no client is found.
 *
 * @returns The CubeApi instance from context, or undefined
 */
export function tryGetCubeClient(): CubeApi | undefined {
	return getContext<CubeApi | undefined>(CUBE_CLIENT_KEY);
}
