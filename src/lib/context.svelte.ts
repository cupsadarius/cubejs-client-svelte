import { getContext, setContext } from 'svelte';
import type { CubeApi } from '@cubejs-client/core';

/**
 * Context key for the CubeJS client.
 * Exported for advanced use cases where direct context access is needed.
 */
export const CUBE_CLIENT_KEY = Symbol('cube-client');

/**
 * Reactive container for the CubeJS client.
 * This allows the context to be set synchronously during component initialization
 * while the actual client value can be updated reactively.
 */
export interface CubeClientContext {
	current: CubeApi | null;
}

/**
 * Set a pre-created context object in the component context.
 * Must be called synchronously during component initialization (not in $effect).
 *
 * For most use cases, use CubeProvider instead. This is for advanced scenarios
 * where you need manual control over the context.
 *
 * @param context - The reactive context container (created with $state in the component)
 */
export function setCubeClientContext(context: CubeClientContext): void {
	setContext(CUBE_CLIENT_KEY, context);
}

/**
 * Set the CubeJS client in the component context.
 * Call this in a parent component to make the client available to all children.
 * Must be called synchronously during component initialization (not in $effect).
 *
 * @param client - The CubeApi instance to set in context
 */
export function setCubeClient(client: CubeApi): void {
	// Create a simple object wrapper - the caller should use $state if reactivity is needed
	setContext(CUBE_CLIENT_KEY, { current: client });
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
	const context = getContext<CubeClientContext | undefined>(CUBE_CLIENT_KEY);

	if (!context || !context.current) {
		throw new Error(
			'No CubeJS client found in context. ' +
				'Make sure to wrap your component tree with CubeProvider or call setCubeClient.'
		);
	}

	return context.current;
}

/**
 * Try to get the CubeJS client from context without throwing.
 * Returns undefined if no client is found.
 *
 * @returns The CubeApi instance from context, or undefined
 */
export function tryGetCubeClient(): CubeApi | undefined {
	const context = getContext<CubeClientContext | undefined>(CUBE_CLIENT_KEY);
	return context?.current ?? undefined;
}
