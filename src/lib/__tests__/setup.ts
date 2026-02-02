import { vi } from 'vitest';
import type { CubeApi, ResultSet, Meta, DryRunResponse, SqlQuery } from '@cubejs-client/core';

/**
 * Create a mock CubeApi client for testing
 */
export function createMockClient(overrides?: Partial<CubeApi>): CubeApi {
	return {
		load: vi.fn(),
		meta: vi.fn(),
		sql: vi.fn(),
		dryRun: vi.fn(),
		subscribe: vi.fn(),
		...overrides
	} as unknown as CubeApi;
}

/**
 * Create a mock ResultSet for testing
 */
export function createMockResultSet(data?: {
	tablePivot?: Record<string, unknown>[];
	chartPivot?: Array<{ x: string; [key: string]: string | number }>;
	seriesNames?: Array<{ key: string; title: string; shortTitle: string; yValues: string[] }>;
	tableColumns?: Array<{ key: string; title: string; shortTitle: string; type: string }>;
}): ResultSet {
	const defaultTablePivot = [{ 'Orders.count': 100, 'Orders.status': 'completed' }];
	const defaultChartPivot = [{ x: '2024-01', 'Orders.count': 100 }];
	const defaultSeriesNames = [
		{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: ['Orders.count'] }
	];
	const defaultTableColumns = [
		{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', type: 'number' },
		{ key: 'Orders.status', title: 'Orders Status', shortTitle: 'Status', type: 'string' }
	];

	return {
		tablePivot: vi.fn().mockReturnValue(data?.tablePivot ?? defaultTablePivot),
		chartPivot: vi.fn().mockReturnValue(data?.chartPivot ?? defaultChartPivot),
		seriesNames: vi.fn().mockReturnValue(data?.seriesNames ?? defaultSeriesNames),
		tableColumns: vi.fn().mockReturnValue(data?.tableColumns ?? defaultTableColumns),
		pivot: vi.fn().mockReturnValue([]),
		rawData: vi.fn().mockReturnValue([]),
		annotation: vi.fn().mockReturnValue({}),
		loadResponse: {},
		loadResponses: []
	} as unknown as ResultSet;
}

/**
 * Create a mock Meta object for testing
 */
export function createMockMeta(overrides?: Partial<Meta>): Meta {
	return {
		cubes: [
			{
				name: 'Orders',
				title: 'Orders',
				measures: [
					{
						name: 'Orders.count',
						title: 'Orders Count',
						shortTitle: 'Count',
						type: 'number',
						aggType: 'count',
						drillMembers: [],
						drillMembersGrouped: { measures: [], dimensions: [] },
						public: true,
						isVisible: true,
						cumulative: false,
						cumulativeTotal: false
					},
					{
						name: 'Orders.totalAmount',
						title: 'Orders Total Amount',
						shortTitle: 'Total',
						type: 'number',
						aggType: 'sum',
						drillMembers: [],
						drillMembersGrouped: { measures: [], dimensions: [] },
						public: true,
						isVisible: true,
						cumulative: false,
						cumulativeTotal: false
					}
				],
				dimensions: [
					{
						name: 'Orders.status',
						title: 'Orders Status',
						shortTitle: 'Status',
						type: 'string',
						suggestFilterValues: false,
						public: true,
						isVisible: true,
						primaryKey: false
					},
					{
						name: 'Orders.createdAt',
						title: 'Orders Created At',
						shortTitle: 'Created',
						type: 'time',
						suggestFilterValues: false,
						public: true,
						isVisible: true,
						primaryKey: false
					}
				],
				segments: [
					{
						name: 'Orders.completed',
						title: 'Completed Orders',
						shortTitle: 'Completed',
						public: true,
						isVisible: true
					}
				]
			}
		],
		...overrides
	} as unknown as Meta;
}

/**
 * Create a mock DryRunResponse for testing
 */
export function createMockDryRunResponse(overrides?: Partial<DryRunResponse>): DryRunResponse {
	return {
		queryType: 'regularQuery',
		normalizedQueries: [
			{
				measures: ['Orders.count'],
				dimensions: ['Orders.status'],
				segments: [],
				timeDimensions: [],
				filters: [],
				timezone: 'UTC'
			}
		],
		queryOrder: [{ id: 'Orders.status', desc: false }],
		pivotQuery: {
			measures: ['Orders.count'],
			dimensions: ['Orders.status'],
			segments: [],
			timeDimensions: [],
			filters: [],
			timezone: 'UTC'
		},
		...overrides
	} as unknown as DryRunResponse;
}

/**
 * Create a mock SqlQuery for testing
 */
export function createMockSqlQuery(): SqlQuery {
	return {
		sql: vi.fn().mockReturnValue('SELECT * FROM orders'),
		rawQuery: vi.fn().mockReturnValue({ sql: 'SELECT * FROM orders', params: [] })
	} as unknown as SqlQuery;
}

/**
 * Helper to flush promises and wait for async operations
 */
export async function flushPromises(): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Helper to wait for a condition to be true
 */
export async function waitFor(
	condition: () => boolean,
	timeout = 1000,
	interval = 10
): Promise<void> {
	const start = Date.now();
	while (!condition()) {
		if (Date.now() - start > timeout) {
			throw new Error('waitFor timeout');
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}
}
