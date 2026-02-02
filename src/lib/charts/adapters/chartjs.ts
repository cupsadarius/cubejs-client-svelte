import type { ResultSet, PivotConfig } from '@cubejs-client/core';
import type { ChartAdapter, ChartData, ChartType, TableData, NumberData } from '../adapter.js';

/**
 * Default color palette for Chart.js
 */
const COLORS = [
	'rgba(54, 162, 235, 0.8)', // Blue
	'rgba(255, 99, 132, 0.8)', // Red
	'rgba(75, 192, 192, 0.8)', // Teal
	'rgba(255, 206, 86, 0.8)', // Yellow
	'rgba(153, 102, 255, 0.8)', // Purple
	'rgba(255, 159, 64, 0.8)', // Orange
	'rgba(199, 199, 199, 0.8)', // Grey
	'rgba(83, 102, 255, 0.8)', // Indigo
	'rgba(255, 99, 255, 0.8)', // Pink
	'rgba(99, 255, 132, 0.8)' // Green
];

/**
 * Default border color palette for Chart.js
 */
const BORDER_COLORS = COLORS.map((color) => color.replace('0.8', '1'));

/**
 * Chart.js adapter for transforming CubeJS ResultSet data
 *
 * @example
 * ```svelte
 * <script>
 *   import { createCubeQuery } from 'cubejs-client-svelte';
 *   import { chartJsAdapter } from 'cubejs-client-svelte/charts/chartjs';
 *   import { Chart } from 'chart.js/auto';
 *
 *   const result = createCubeQuery({
 *     measures: ['Orders.count'],
 *     timeDimensions: [{
 *       dimension: 'Orders.createdAt',
 *       granularity: 'month'
 *     }]
 *   });
 *
 *   let canvas: HTMLCanvasElement;
 *
 *   $effect(() => {
 *     if (result.data && canvas) {
 *       const chartData = chartJsAdapter.transformData(result.data, 'line');
 *       new Chart(canvas, {
 *         type: 'line',
 *         data: chartData,
 *         options: chartJsAdapter.getDefaultOptions('line')
 *       });
 *     }
 *   });
 * </script>
 *
 * <canvas bind:this={canvas}></canvas>
 * ```
 */
export const chartJsAdapter: ChartAdapter = {
	transformData(
		resultSet: ResultSet,
		chartType: ChartType,
		pivotConfig?: PivotConfig
	): ChartData | TableData | NumberData {
		switch (chartType) {
			case 'table':
				return transformToTableData(resultSet, pivotConfig);
			case 'number':
				return transformToNumberData(resultSet);
			case 'pie':
				return transformToPieData(resultSet, pivotConfig);
			default:
				return transformToChartData(resultSet, chartType, pivotConfig);
		}
	},

	getDefaultOptions(chartType: ChartType): Record<string, unknown> {
		const baseOptions = {
			responsive: true,
			maintainAspectRatio: true,
			plugins: {
				legend: {
					position: 'top' as const
				}
			}
		};

		switch (chartType) {
			case 'line':
				return {
					...baseOptions,
					scales: {
						y: {
							beginAtZero: true
						}
					},
					elements: {
						line: {
							tension: 0.4
						}
					}
				};

			case 'bar':
				return {
					...baseOptions,
					scales: {
						y: {
							beginAtZero: true
						}
					}
				};

			case 'area':
				return {
					...baseOptions,
					scales: {
						y: {
							beginAtZero: true,
							stacked: true
						},
						x: {
							stacked: true
						}
					},
					elements: {
						line: {
							tension: 0.4
						}
					}
				};

			case 'pie':
				return {
					...baseOptions,
					plugins: {
						legend: {
							position: 'right' as const
						}
					}
				};

			default:
				return baseOptions;
		}
	}
};

/**
 * Transform ResultSet to standard chart data (line, bar, area)
 */
function transformToChartData(
	resultSet: ResultSet,
	chartType: ChartType,
	pivotConfig?: PivotConfig
): ChartData {
	const chartPivot = resultSet.chartPivot(pivotConfig);
	const seriesNames = resultSet.seriesNames(pivotConfig);

	const labels = chartPivot.map((row) => row.x);

	const datasets = seriesNames.map((series, index) => {
		const data = chartPivot.map((row) => {
			const value = row[series.key];
			return typeof value === 'number' ? value : parseFloat(value) || 0;
		});

		const colorIndex = index % COLORS.length;
		const baseDataset = {
			label: series.title,
			data,
			backgroundColor: COLORS[colorIndex],
			borderColor: BORDER_COLORS[colorIndex],
			borderWidth: 2
		};

		// Add fill for area charts
		if (chartType === 'area') {
			return {
				...baseDataset,
				fill: true
			};
		}

		return baseDataset;
	});

	return { labels, datasets };
}

/**
 * Transform ResultSet to pie chart data
 */
function transformToPieData(resultSet: ResultSet, pivotConfig?: PivotConfig): ChartData {
	const chartPivot = resultSet.chartPivot(pivotConfig);
	const seriesNames = resultSet.seriesNames(pivotConfig);

	// For pie charts, we typically want labels on one axis and a single measure
	const labels = chartPivot.map((row) => row.x);

	// Use the first series for pie chart data
	const firstSeries = seriesNames[0];
	const data = chartPivot.map((row) => {
		const value = row[firstSeries?.key ?? ''];
		return typeof value === 'number' ? value : parseFloat(value) || 0;
	});

	const backgroundColors = labels.map((_, index) => COLORS[index % COLORS.length]);
	const borderColors = labels.map((_, index) => BORDER_COLORS[index % BORDER_COLORS.length]);

	return {
		labels,
		datasets: [
			{
				label: firstSeries?.title ?? 'Value',
				data,
				backgroundColor: backgroundColors,
				borderColor: borderColors,
				borderWidth: 1
			}
		]
	};
}

/**
 * Transform ResultSet to table data
 */
function transformToTableData(resultSet: ResultSet, pivotConfig?: PivotConfig): TableData {
	const tableColumns = resultSet.tableColumns(pivotConfig);
	const tablePivot = resultSet.tablePivot(pivotConfig);

	const columns = tableColumns.map((col) => ({
		key: col.key,
		title: col.title,
		shortTitle: col.shortTitle,
		type: col.type as string
	}));

	const rows = tablePivot;

	return { columns, rows };
}

/**
 * Transform ResultSet to single number data
 */
function transformToNumberData(resultSet: ResultSet): NumberData {
	const seriesNames = resultSet.seriesNames();
	const chartPivot = resultSet.chartPivot();

	// Get the first value from the first series
	const firstSeries = seriesNames[0];
	const firstRow = chartPivot[0];

	if (!firstSeries || !firstRow) {
		return { value: 0 };
	}

	const value = firstRow[firstSeries.key];

	return {
		value: typeof value === 'number' ? value : parseFloat(value) || 0,
		label: firstSeries.title
	};
}

export default chartJsAdapter;
