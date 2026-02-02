import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/svelte';
import { createMockClient, createMockSqlQuery, flushPromises } from '../setup.js';
import TestSqlWrapper from '../TestSqlWrapper.svelte';
import type { SqlState } from '../../query/createCubeSql.svelte.js';

describe('createCubeSql', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('throws error when no client is available', () => {
			expect(() =>
				render(TestSqlWrapper, {
					props: {
						query: { measures: ['Orders.count'] },
						options: {}
					}
				})
			).toThrow('No CubeJS client available');
		});

		it('accepts client override option', async () => {
			const mockClient = createMockClient();
			mockClient.sql = vi.fn().mockResolvedValue(createMockSqlQuery());

			expect(() =>
				render(TestSqlWrapper, {
					props: {
						query: { measures: ['Orders.count'] },
						options: { client: mockClient }
					}
				})
			).not.toThrow();
		});

		it('returns correct initial state shape', async () => {
			const mockClient = createMockClient();
			mockClient.sql = vi.fn().mockResolvedValue(createMockSqlQuery());

			let capturedState: SqlState | null = null;

			render(TestSqlWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: SqlState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			expect(capturedState).toHaveProperty('sql');
			expect(capturedState).toHaveProperty('loading');
			expect(capturedState).toHaveProperty('error');
			expect(capturedState).toHaveProperty('refetch');
		});
	});

	describe('SQL generation', () => {
		it('fetches SQL for valid query', async () => {
			const mockSqlQuery = createMockSqlQuery();
			const mockClient = createMockClient();
			mockClient.sql = vi.fn().mockResolvedValue(mockSqlQuery);

			const query = { measures: ['Orders.count'] };
			render(TestSqlWrapper, {
				props: {
					query,
					options: { client: mockClient }
				}
			});

			await flushPromises();
			await waitFor(() => expect(mockClient.sql).toHaveBeenCalledWith(query));
		});

		it('sets sql on successful fetch', async () => {
			const mockSqlQuery = createMockSqlQuery();
			const mockClient = createMockClient();
			mockClient.sql = vi.fn().mockResolvedValue(mockSqlQuery);

			let capturedState: SqlState | null = null;

			render(TestSqlWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: SqlState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.sql).toStrictEqual(mockSqlQuery));
		});
	});

	describe('empty/invalid queries', () => {
		it('does not fetch SQL for empty query', async () => {
			const mockClient = createMockClient();
			mockClient.sql = vi.fn().mockResolvedValue(createMockSqlQuery());

			render(TestSqlWrapper, {
				props: {
					query: {},
					options: { client: mockClient }
				}
			});

			await flushPromises();
			await new Promise((r) => setTimeout(r, 50));
			expect(mockClient.sql).not.toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		it('sets error on failed fetch', async () => {
			const mockError = new Error('SQL generation failed');
			const mockClient = createMockClient();
			mockClient.sql = vi.fn().mockRejectedValue(mockError);

			let capturedState: SqlState | null = null;

			render(TestSqlWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: SqlState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.error).toEqual(mockError));
		});
	});

	describe('refetch', () => {
		it('re-fetches SQL when refetch is called', async () => {
			const mockSqlQuery = createMockSqlQuery();
			const mockClient = createMockClient();
			mockClient.sql = vi.fn().mockResolvedValue(mockSqlQuery);

			let capturedState: SqlState | null = null;

			render(TestSqlWrapper, {
				props: {
					query: { measures: ['Orders.count'] },
					options: { client: mockClient },
					onStateChange: (state: SqlState) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(mockClient.sql).toHaveBeenCalledTimes(1));

			await capturedState!.refetch();
			expect(mockClient.sql).toHaveBeenCalledTimes(2);
		});
	});
});
