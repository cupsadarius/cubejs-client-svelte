import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/svelte';
import { createMockClient, createMockResultSet, flushPromises } from '../setup.js';
import TestQueryWrapper from '../TestQueryWrapper.svelte';
import type { QueryState } from '../../types.js';

describe('createCubeQuery', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('throws error when no client is available', () => {
			expect(() =>
				render(TestQueryWrapper, {
					props: {
						query: { measures: ['Orders.count'] },
						options: {}
					}
				})
			).toThrow('No CubeJS client available');
		});

		it('accepts client override option', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(createMockResultSet());

			expect(() =>
				render(TestQueryWrapper, {
					props: {
						query: { measures: ['Orders.count'] },
						options: { client: mockClient }
					}
				})
			).not.toThrow();
		});

		it('returns correct initial state shape', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(createMockResultSet());

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			expect(capturedState).toHaveProperty('data');
			expect(capturedState).toHaveProperty('loading');
			expect(capturedState).toHaveProperty('error');
			expect(capturedState).toHaveProperty('refetch');
		});
	});

	describe('static query execution', () => {
		it('executes query with measures', async () => {
			const mockResultSet = createMockResultSet();
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(mockResultSet);

			const query = { measures: ['Orders.count'] };
			render(TestQueryWrapper, {
				props: {
					query,
					options: { client: mockClient }
				}
			});

			await flushPromises();
			await waitFor(() => expect(mockClient.load).toHaveBeenCalledWith(query, {}));
		});

		it('executes query with dimensions', async () => {
			const mockResultSet = createMockResultSet();
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(mockResultSet);

			const query = { dimensions: ['Orders.status'] };
			render(TestQueryWrapper, {
				props: {
					query,
					options: { client: mockClient }
				}
			});

			await flushPromises();
			await waitFor(() => expect(mockClient.load).toHaveBeenCalledWith(query, {}));
		});

		it('sets data on successful query', async () => {
			const mockResultSet = createMockResultSet();
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(mockResultSet);

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.data).toStrictEqual(mockResultSet));
		});

		it('sets loading to false after query completes', async () => {
			const mockResultSet = createMockResultSet();
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(mockResultSet);

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
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

	describe('empty/invalid queries', () => {
		it('does not execute empty query object', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(createMockResultSet());

			render(TestQueryWrapper, {
				props: {
					query: {},
					options: { client: mockClient }
				}
			});

			await flushPromises();
			// Wait a bit to ensure no call was made
			await new Promise((r) => setTimeout(r, 50));
			expect(mockClient.load).not.toHaveBeenCalled();
		});

		it('does not execute query with empty measures array', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(createMockResultSet());

			render(TestQueryWrapper, {
				props: {
					query: { measures: [] },
					options: { client: mockClient }
				}
			});

			await flushPromises();
			await new Promise((r) => setTimeout(r, 50));
			expect(mockClient.load).not.toHaveBeenCalled();
		});

		it('sets data to null for empty query', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(createMockResultSet());

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: {},
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			expect(capturedState?.data).toBeNull();
			expect(capturedState?.loading).toBe(false);
			expect(capturedState?.error).toBeNull();
		});
	});

	describe('skip option', () => {
		it('does not execute query when skip is true', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(createMockResultSet());

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient, skip: true }
				}
			});

			await flushPromises();
			await new Promise((r) => setTimeout(r, 50));
			expect(mockClient.load).not.toHaveBeenCalled();
		});

		it('resets state when skip is true', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(createMockResultSet());

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient, skip: true },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			expect(capturedState?.data).toBeNull();
			expect(capturedState?.loading).toBe(false);
			expect(capturedState?.error).toBeNull();
		});
	});

	describe('error handling', () => {
		it('sets error on failed query', async () => {
			const mockError = new Error('Query failed');
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockRejectedValue(mockError);

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.error).toEqual(mockError));
		});

		it('sets data to null on error', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockRejectedValue(new Error('Failed'));

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.data).toBeNull());
		});

		it('converts non-Error exceptions to Error objects', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockRejectedValue('String error');

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
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

		it('sets loading to false on error', async () => {
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockRejectedValue(new Error('Failed'));

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
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

	describe('refetch', () => {
		it('re-executes query when refetch is called', async () => {
			const mockResultSet = createMockResultSet();
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(mockResultSet);

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(mockClient.load).toHaveBeenCalledTimes(1));

			await capturedState!.refetch();
			expect(mockClient.load).toHaveBeenCalledTimes(2);
		});

		it('updates state with new data on refetch', async () => {
			const mockResultSet1 = createMockResultSet({ tablePivot: [{ 'Orders.count': 100 }] });
			const mockResultSet2 = createMockResultSet({ tablePivot: [{ 'Orders.count': 200 }] });

			const mockClient = createMockClient();
			mockClient.load = vi
				.fn()
				.mockResolvedValueOnce(mockResultSet1)
				.mockResolvedValueOnce(mockResultSet2);

			let capturedState: QueryState | null = null;

			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.data).toStrictEqual(mockResultSet1));

			await capturedState!.refetch();
			await waitFor(() => expect(capturedState?.data).toStrictEqual(mockResultSet2));
		});
	});

	describe('load options', () => {
		it('passes additional load options to client.load', async () => {
			const mockResultSet = createMockResultSet();
			const mockClient = createMockClient();
			mockClient.load = vi.fn().mockResolvedValue(mockResultSet);

			const loadOptions = { mutexKey: 'test-key', mutexObj: {} };
			render(TestQueryWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient, ...loadOptions }
				}
			});

			await flushPromises();
			await waitFor(() =>
				expect(mockClient.load).toHaveBeenCalledWith(
					{ measures: ['Orders.count'] },
					expect.objectContaining(loadOptions)
				)
			);
		});
	});
});
