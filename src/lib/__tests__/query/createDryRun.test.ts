import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/svelte';
import { createMockClient, createMockDryRunResponse, flushPromises } from '../setup.js';
import TestDryRunWrapper from '../TestDryRunWrapper.svelte';
import type { DryRunState } from '../../types.js';

describe('createDryRun', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('throws error when no client is available', () => {
			expect(() =>
				render(TestDryRunWrapper, {
					props: {
						query: { measures: ['Orders.count'] },
						options: {}
					}
				})
			).toThrow('No CubeJS client available');
		});

		it('accepts client override option', async () => {
			const mockClient = createMockClient();
			mockClient.dryRun = vi.fn().mockResolvedValue(createMockDryRunResponse());

			expect(() =>
				render(TestDryRunWrapper, {
					props: {
						query: { measures: ['Orders.count'] },
						options: { client: mockClient }
					}
				})
			).not.toThrow();
		});

		it('returns correct initial state shape', async () => {
			const mockClient = createMockClient();
			mockClient.dryRun = vi.fn().mockResolvedValue(createMockDryRunResponse());

			let capturedState: DryRunState | null = null;

			render(TestDryRunWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: DryRunState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			expect(capturedState).toHaveProperty('result');
			expect(capturedState).toHaveProperty('loading');
			expect(capturedState).toHaveProperty('error');
			expect(capturedState).toHaveProperty('refetch');
		});
	});

	describe('dry run execution', () => {
		it('executes dry run with valid query', async () => {
			const mockResponse = createMockDryRunResponse();
			const mockClient = createMockClient();
			mockClient.dryRun = vi.fn().mockResolvedValue(mockResponse);

			const query = { measures: ['Orders.count'] };
			render(TestDryRunWrapper, {
				props: {
					query,
					options: { client: mockClient }
				}
			});

			await flushPromises();
			await waitFor(() => expect(mockClient.dryRun).toHaveBeenCalledWith(query));
		});

		it('sets result on successful dry run', async () => {
			const mockResponse = createMockDryRunResponse();
			const mockClient = createMockClient();
			mockClient.dryRun = vi.fn().mockResolvedValue(mockResponse);

			let capturedState: DryRunState | null = null;

			render(TestDryRunWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: DryRunState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.result).toStrictEqual(mockResponse));
		});
	});

	describe('empty/invalid queries', () => {
		it('does not execute dry run for empty query', async () => {
			const mockClient = createMockClient();
			mockClient.dryRun = vi.fn().mockResolvedValue(createMockDryRunResponse());

			render(TestDryRunWrapper, {
				props: {
					query: {},
					options: { client: mockClient }
				}
			});

			await flushPromises();
			await new Promise((r) => setTimeout(r, 50));
			expect(mockClient.dryRun).not.toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		it('sets error on failed dry run', async () => {
			const mockError = new Error('Dry run failed');
			const mockClient = createMockClient();
			mockClient.dryRun = vi.fn().mockRejectedValue(mockError);

			let capturedState: DryRunState | null = null;

			render(TestDryRunWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: DryRunState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.error).toEqual(mockError));
		});
	});

	describe('refetch', () => {
		it('re-executes dry run when refetch is called', async () => {
			const mockResponse = createMockDryRunResponse();
			const mockClient = createMockClient();
			mockClient.dryRun = vi.fn().mockResolvedValue(mockResponse);

			let capturedState: DryRunState | null = null;

			render(TestDryRunWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: DryRunState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(mockClient.dryRun).toHaveBeenCalledTimes(1));

			await capturedState!.refetch();
			expect(mockClient.dryRun).toHaveBeenCalledTimes(2);
		});
	});
});
