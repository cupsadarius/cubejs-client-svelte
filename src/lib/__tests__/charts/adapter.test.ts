import { describe, it, expect } from 'vitest';
import { getSeriesNames, getLabels } from '../../charts/adapter.js';
import { chartJsAdapter } from '../../charts/adapters/chartjs.js';
import { createMockResultSet } from '../setup.js';
import type { ChartData, TableData, NumberData } from '../../charts/adapter.js';

describe('chart adapter helpers', () => {
	describe('getSeriesNames', () => {
		it('extracts series titles from ResultSet', () => {
			const mockResultSet = createMockResultSet({
				seriesNames: [
					{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] },
					{ key: 'Orders.totalAmount', title: 'Orders Total Amount', shortTitle: 'Total', yValues: [] }
				]
			});

			const names = getSeriesNames(mockResultSet);

			expect(names).toEqual(['Orders Count', 'Orders Total Amount']);
		});

		it('returns empty array for no series', () => {
			const mockResultSet = createMockResultSet({
				seriesNames: []
			});

			const names = getSeriesNames(mockResultSet);

			expect(names).toEqual([]);
		});
	});

	describe('getLabels', () => {
		it('extracts x values from chartPivot', () => {
			const mockResultSet = createMockResultSet({
				chartPivot: [
					{ x: '2024-01', 'Orders.count': 100 },
					{ x: '2024-02', 'Orders.count': 150 },
					{ x: '2024-03', 'Orders.count': 200 }
				]
			});

			const labels = getLabels(mockResultSet);

			expect(labels).toEqual(['2024-01', '2024-02', '2024-03']);
		});

		it('returns empty array for no data', () => {
			const mockResultSet = createMockResultSet({
				chartPivot: []
			});

			const labels = getLabels(mockResultSet);

			expect(labels).toEqual([]);
		});
	});
});

describe('chartJsAdapter', () => {
	describe('transformData', () => {
		describe('line chart', () => {
			it('transforms ResultSet to line chart data', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [
						{ x: 'Jan', 'Orders.count': 100 },
						{ x: 'Feb', 'Orders.count': 150 },
						{ x: 'Mar', 'Orders.count': 200 }
					],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'line') as ChartData;

				expect(result.labels).toEqual(['Jan', 'Feb', 'Mar']);
				expect(result.datasets).toHaveLength(1);
				expect(result.datasets[0].label).toBe('Orders Count');
				expect(result.datasets[0].data).toEqual([100, 150, 200]);
			});

			it('handles multiple series', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [
						{ x: 'Jan', 'Orders.count': 100, 'Orders.totalAmount': 1000 },
						{ x: 'Feb', 'Orders.count': 150, 'Orders.totalAmount': 1500 }
					],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] },
						{ key: 'Orders.totalAmount', title: 'Total Amount', shortTitle: 'Amount', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'line') as ChartData;

				expect(result.datasets).toHaveLength(2);
				expect(result.datasets[0].label).toBe('Orders Count');
				expect(result.datasets[1].label).toBe('Total Amount');
			});

			it('assigns colors to datasets', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [{ x: 'Jan', 'Orders.count': 100 }],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'line') as ChartData;

				expect(result.datasets[0].backgroundColor).toBeDefined();
				expect(result.datasets[0].borderColor).toBeDefined();
			});
		});

		describe('bar chart', () => {
			it('transforms ResultSet to bar chart data', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [
						{ x: 'completed', 'Orders.count': 100 },
						{ x: 'pending', 'Orders.count': 50 }
					],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'bar') as ChartData;

				expect(result.labels).toEqual(['completed', 'pending']);
				expect(result.datasets[0].data).toEqual([100, 50]);
			});
		});

		describe('area chart', () => {
			it('transforms ResultSet to area chart data with fill', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [
						{ x: 'Jan', 'Orders.count': 100 },
						{ x: 'Feb', 'Orders.count': 150 }
					],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'area') as ChartData;

				expect(result.datasets[0].fill).toBe(true);
			});
		});

		describe('pie chart', () => {
			it('transforms ResultSet to pie chart data', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [
						{ x: 'completed', 'Orders.count': 100 },
						{ x: 'pending', 'Orders.count': 50 },
						{ x: 'cancelled', 'Orders.count': 25 }
					],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'pie') as ChartData;

				expect(result.labels).toEqual(['completed', 'pending', 'cancelled']);
				expect(result.datasets).toHaveLength(1);
				expect(result.datasets[0].data).toEqual([100, 50, 25]);
			});

			it('assigns unique colors per slice', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [
						{ x: 'a', 'Orders.count': 10 },
						{ x: 'b', 'Orders.count': 20 },
						{ x: 'c', 'Orders.count': 30 }
					],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'pie') as ChartData;

				const bgColors = result.datasets[0].backgroundColor as string[];
				expect(bgColors).toHaveLength(3);
				// Colors should be different
				expect(new Set(bgColors).size).toBe(3);
			});
		});

		describe('table', () => {
			it('transforms ResultSet to table data', () => {
				const mockResultSet = createMockResultSet({
					tablePivot: [
						{ 'Orders.count': 100, 'Orders.status': 'completed' },
						{ 'Orders.count': 50, 'Orders.status': 'pending' }
					],
					tableColumns: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', type: 'number' },
						{ key: 'Orders.status', title: 'Orders Status', shortTitle: 'Status', type: 'string' }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'table') as TableData;

				expect(result.columns).toHaveLength(2);
				expect(result.columns[0].key).toBe('Orders.count');
				expect(result.rows).toHaveLength(2);
				expect(result.rows[0]['Orders.count']).toBe(100);
			});
		});

		describe('number', () => {
			it('transforms ResultSet to single number data', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [{ x: 'Total', 'Orders.count': 500 }],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'number') as NumberData;

				expect(result.value).toBe(500);
				expect(result.label).toBe('Orders Count');
			});

			it('returns 0 for empty data', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [],
					seriesNames: []
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'number') as NumberData;

				expect(result.value).toBe(0);
			});
		});

		describe('edge cases', () => {
			it('handles string number values by parsing', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [{ x: 'Jan', 'Orders.count': '100.5' }],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'line') as ChartData;

				expect(result.datasets[0].data[0]).toBe(100.5);
			});

			it('handles invalid number values as 0', () => {
				const mockResultSet = createMockResultSet({
					chartPivot: [{ x: 'Jan', 'Orders.count': 'not-a-number' }],
					seriesNames: [
						{ key: 'Orders.count', title: 'Orders Count', shortTitle: 'Count', yValues: [] }
					]
				});

				const result = chartJsAdapter.transformData(mockResultSet, 'line') as ChartData;

				expect(result.datasets[0].data[0]).toBe(0);
			});
		});
	});

	describe('getDefaultOptions', () => {
		it('returns responsive options for all chart types', () => {
			const chartTypes = ['line', 'bar', 'area', 'pie'] as const;

			for (const chartType of chartTypes) {
				const options = chartJsAdapter.getDefaultOptions?.(chartType);
				expect(options?.responsive).toBe(true);
			}
		});

		it('returns beginAtZero for line charts', () => {
			const options = chartJsAdapter.getDefaultOptions?.('line');

			expect((options?.scales as { y?: { beginAtZero?: boolean } })?.y?.beginAtZero).toBe(true);
		});

		it('returns beginAtZero for bar charts', () => {
			const options = chartJsAdapter.getDefaultOptions?.('bar');

			expect((options?.scales as { y?: { beginAtZero?: boolean } })?.y?.beginAtZero).toBe(true);
		});

		it('returns stacked options for area charts', () => {
			const options = chartJsAdapter.getDefaultOptions?.('area');

			expect((options?.scales as { y?: { stacked?: boolean } })?.y?.stacked).toBe(true);
		});

		it('returns legend position right for pie charts', () => {
			const options = chartJsAdapter.getDefaultOptions?.('pie');

			expect((options?.plugins as { legend?: { position?: string } })?.legend?.position).toBe('right');
		});
	});
});
