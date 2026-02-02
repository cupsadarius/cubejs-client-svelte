import { getContext, setContext } from 'svelte';
import type { CubeApi } from '@cubejs-client/core';

const CUBE_CLIENT_KEY = Symbol('cube-client');

/**
 * Reactive container for the CubeJS client.
 * This allows the context to be set synchronously during component initialization
 * while the actual client value can be updated reactively.
 */
export interface CubeClientContext {
	current: CubeApi | null;
}

/**
 * Create and set a reactive CubeJS client context.
 * Must be called synchronously during component initialization (not in $effect).
 *
 * @returns The reactive context container that can be updated
 */
export function createCubeClientContext(): CubeClientContext {
	const context: CubeClientContext = $state({ current: null });
	setContext(CUBE_CLIENT_KEY, context);
	return context;
}

/**
 * Set the CubeJS client in the component context.
 * Call this in a parent component to make the client available to all children.
 * Must be called synchronously during component initialization (not in $effect).
 *
 * @param client - The CubeApi instance to set in context
 */
export function setCubeClient(client: CubeApi): void {
	const context: CubeClientContext = $state({ current: client });
	setContext(CUBE_CLIENT_KEY, context);
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
