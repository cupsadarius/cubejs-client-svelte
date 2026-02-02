import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/svelte';
import { createMockClient, createMockMeta, flushPromises } from '../setup.js';
import TestQueryBuilderWrapper from '../TestQueryBuilderWrapper.svelte';
import type { QueryBuilder } from '../../types.js';

describe('createQueryBuilder', () => {
	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('throws error when no client is available', () => {
			expect(() =>
				render(TestQueryBuilderWrapper, {
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
				render(TestQueryBuilderWrapper, {
					props: {
						options: { client: mockClient }
					}
				})
			).not.toThrow();
		});

		it('returns correct initial state shape', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			// State properties
			expect(capturedState).toHaveProperty('measures');
			expect(capturedState).toHaveProperty('dimensions');
			expect(capturedState).toHaveProperty('segments');
			expect(capturedState).toHaveProperty('timeDimensions');
			expect(capturedState).toHaveProperty('filters');
			expect(capturedState).toHaveProperty('order');
			expect(capturedState).toHaveProperty('chartType');

			// Available members
			expect(capturedState).toHaveProperty('availableMeasures');
			expect(capturedState).toHaveProperty('availableDimensions');

			// Derived query
			expect(capturedState).toHaveProperty('query');

			// Actions
			expect(typeof capturedState?.addMeasure).toBe('function');
			expect(typeof capturedState?.removeMeasure).toBe('function');
		});

		it('initializes with default chart type line', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			expect(capturedState?.chartType).toBe('line');
		});

		it('respects initial chart type option', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient, initialChartType: 'bar' },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			expect(capturedState?.chartType).toBe('bar');
		});

		it('initializes with initial query values', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: {
						client: mockClient,
						initialQuery: {
							measures: ['Orders.count'],
							dimensions: ['Orders.status'],
							limit: 100
						}
					},
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			expect(capturedState?.measures).toEqual(['Orders.count']);
			expect(capturedState?.dimensions).toEqual(['Orders.status']);
			expect(capturedState?.limit).toBe(100);
		});
	});

	describe('metadata fetching', () => {
		it('fetches metadata on initialization', async () => {
			const mockMeta = createMockMeta();
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(mockMeta);

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient }
				}
			});

			await flushPromises();
			expect(mockClient.meta).toHaveBeenCalled();
		});

		it('populates available members from metadata', async () => {
			const mockMeta = createMockMeta();
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(mockMeta);

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => {
				expect(capturedState?.availableMeasures.length).toBeGreaterThan(0);
				expect(capturedState?.availableDimensions.length).toBeGreaterThan(0);
			});
		});

		it('sets metaError on failed fetch', async () => {
			const mockError = new Error('Meta fetch failed');
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockRejectedValue(mockError);

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			await waitFor(() => expect(capturedState?.metaError).toEqual(mockError));
		});
	});

	describe('measure actions', () => {
		it('addMeasure adds a measure', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.addMeasure('Orders.count');
			expect(capturedState?.measures).toContain('Orders.count');
		});

		it('addMeasure does not add duplicate', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.addMeasure('Orders.count');
			capturedState!.addMeasure('Orders.count');
			expect(capturedState?.measures.filter((m) => m === 'Orders.count').length).toBe(1);
		});

		it('removeMeasure removes a measure', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: {
						client: mockClient,
						initialQuery: { measures: ['Orders.count', 'Orders.totalAmount'] }
					},
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.removeMeasure('Orders.count');
			expect(capturedState?.measures).not.toContain('Orders.count');
			expect(capturedState?.measures).toContain('Orders.totalAmount');
		});

		it('setMeasures replaces all measures', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: {
						client: mockClient,
						initialQuery: { measures: ['Orders.count'] }
					},
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.setMeasures(['Orders.totalAmount', 'Orders.avgAmount']);
			expect(capturedState?.measures).toEqual(['Orders.totalAmount', 'Orders.avgAmount']);
		});
	});

	describe('dimension actions', () => {
		it('addDimension adds a dimension', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.addDimension('Orders.status');
			expect(capturedState?.dimensions).toContain('Orders.status');
		});

		it('removeDimension removes a dimension', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: {
						client: mockClient,
						initialQuery: { dimensions: ['Orders.status', 'Orders.customer'] }
					},
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.removeDimension('Orders.status');
			expect(capturedState?.dimensions).not.toContain('Orders.status');
			expect(capturedState?.dimensions).toContain('Orders.customer');
		});
	});

	describe('other setters', () => {
		it('setChartType changes chart type', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.setChartType('bar');
			expect(capturedState?.chartType).toBe('bar');
		});

		it('setLimit sets limit', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();
			capturedState!.setLimit(50);
			expect(capturedState?.limit).toBe(50);
		});
	});

	describe('reset', () => {
		it('resets to initial state', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: {
						client: mockClient,
						initialQuery: { measures: ['Orders.count'] },
						initialChartType: 'bar'
					},
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			// Make some changes
			capturedState!.addMeasure('Orders.totalAmount');
			capturedState!.setChartType('pie');
			capturedState!.setLimit(50);

			// Reset
			capturedState!.reset();

			expect(capturedState?.measures).toEqual(['Orders.count']);
			expect(capturedState?.chartType).toBe('bar');
			expect(capturedState?.limit).toBeUndefined();
		});
	});

	describe('derived query', () => {
		it('generates query object from state', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			capturedState!.addMeasure('Orders.count');
			capturedState!.addDimension('Orders.status');

			expect(capturedState?.query).toEqual({
				measures: ['Orders.count'],
				dimensions: ['Orders.status']
			});
		});

		it('only includes non-empty arrays in query', async () => {
			const mockClient = createMockClient();
			mockClient.meta = vi.fn().mockResolvedValue(createMockMeta());

			let capturedState: QueryBuilder | null = null;

			render(TestQueryBuilderWrapper, {
				props: {
					options: { client: mockClient },
					onStateChange: (state: QueryBuilder) => {
						capturedState = state;
					}
				}
			});

			await flushPromises();

			capturedState!.addMeasure('Orders.count');

			expect(capturedState?.query).toEqual({
				measures: ['Orders.count']
			});
			expect(capturedState?.query).not.toHaveProperty('dimensions');
			expect(capturedState?.query).not.toHaveProperty('filters');
		});
	});
});
