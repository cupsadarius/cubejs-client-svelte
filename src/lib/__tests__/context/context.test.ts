import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockClient } from '../setup.js';

// Mock Svelte's context functions
const mockContextStore = new Map<symbol | string, unknown>();

vi.mock('svelte', async () => {
	return {
		getContext: vi.fn((key: symbol | string) => mockContextStore.get(key)),
		setContext: vi.fn((key: symbol | string, value: unknown) => {
			mockContextStore.set(key, value);
		})
	};
});

// Import after mocking
const { setCubeClient, getCubeClient, tryGetCubeClient } = await import('../../context.svelte.js');

describe('context functions', () => {
	beforeEach(() => {
		mockContextStore.clear();
		vi.clearAllMocks();
	});

	describe('setCubeClient', () => {
		it('sets the client in context', async () => {
			const mockClient = createMockClient();
			const { setContext } = await import('svelte');

			setCubeClient(mockClient);

			expect(setContext).toHaveBeenCalledTimes(1);
			expect(setContext).toHaveBeenCalledWith(expect.any(Symbol), mockClient);
		});
	});

	describe('getCubeClient', () => {
		it('returns the client when set', async () => {
			const mockClient = createMockClient();

			setCubeClient(mockClient);
			const result = getCubeClient();

			expect(result).toBe(mockClient);
		});

		it('throws error when no client is set', () => {
			mockContextStore.clear();

			expect(() => getCubeClient()).toThrow('No CubeJS client found in context');
			expect(() => getCubeClient()).toThrow(
				'Make sure to wrap your component tree with CubeProvider or call setCubeClient'
			);
		});
	});

	describe('tryGetCubeClient', () => {
		it('returns the client when set', async () => {
			const mockClient = createMockClient();

			setCubeClient(mockClient);
			const result = tryGetCubeClient();

			expect(result).toBe(mockClient);
		});

		it('returns undefined when no client is set', () => {
			mockContextStore.clear();

			const result = tryGetCubeClient();

			expect(result).toBeUndefined();
		});

		it('does not throw when no client is set', () => {
			mockContextStore.clear();

			expect(() => tryGetCubeClient()).not.toThrow();
		});
	});
});
