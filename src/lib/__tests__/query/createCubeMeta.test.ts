import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/svelte';
import { createMockClient, createMockMeta, flushPromises } from '../setup.js';
import TestMetaWrapper from '../TestMetaWrapper.svelte';
import type { MetaState } from '../../types.js';

describe('createCubeMeta', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('throws error when no client is available', () => {
			expect(() =>
				render(TestMetaWrapper, {
					props: {
						options: {}
					}
				})
			).toThrow('No CubeJS client available');
		});

		it('accepts client override option', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			expect(() =>
				render(TestMetaWrapper, {
					props: {
						options: { client: mockClient }
					}
				})
			).not.toThrow();
		});

		it('returns correct initial state shape', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			expect(capturedState).toHaveProperty('meta');
			expect(capturedState).toHaveProperty('loading');
			expect(capturedState).toHaveProperty('error');
			expect(capturedState).toHaveProperty('refetch');
		});
	});

	describe('meta fetching', () => {
		it('calls client.meta on initialization', async () => {
			const mockMeta = createMockMeta();
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(mockMeta);

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient }
				}
			});

			await flushPromises();
			expect(mockClient.meta).toHaveBeenCalled();
		});

		it('sets meta data on successful fetch', async () => {
			const mockMeta = createMockMeta();
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(mockMeta);

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.meta).toStrictEqual(mockMeta));
		});

		it('sets loading to false after fetch completes', async () => {
			const mockMeta = createMockMeta();
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(mockMeta);

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.loading).toBe(false));
		});
	});

	describe('error handling', () => {
		it('sets error on failed fetch', async () => {
			const mockError = new Error('Fetch failed');
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockRejectedValue(mockError);

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.error).toEqual(mockError));
		});

		it('sets meta to null on error', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockRejectedValue(new Error('Failed'));

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.meta).toBeNull());
		});

		it('converts non-Error exceptions to Error objects', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockRejectedValue('String error');

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => {
				expect(capturedState?.error).toBeInstanceOf(Error);
				expect(capturedState?.error?.message).toBe('String error');
			});
		});
	});

	describe('refetch', () => {
		it('re-fetches metadata when refetch is called', async () => {
			const mockMeta = createMockMeta();
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(mockMeta);

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			expect(mockClient.meta).toHaveBeenCalledTimes(1);

			await capturedState!.refetch();
			expect(mockClient.meta).toHaveBeenCalledTimes(2);
		});

		it('updates state with new data on refetch', async () => {
			const mockMeta1 = createMockMeta();
			const mockMeta2 = createMockMeta({
				cubes: [{ ...mockMeta1.cubes[0], name: 'UpdatedCube' }]
			});

			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValueOnce(mockMeta1).mockResolvedValueOnce(mockMeta2);

			let capturedState: MetaState | null = null;

			render(TestMetaWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.meta).toStrictEqual(mockMeta1));

			await capturedState!.refetch();
			await waitFor(() => expect(capturedState?.meta).toStrictEqual(mockMeta2));
		});
	});
});
