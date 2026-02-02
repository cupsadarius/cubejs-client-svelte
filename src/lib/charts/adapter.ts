import type { ResultSet, PivotConfig } from '@cubejs-client/core';

/**
 * Chart type supported by adapters
 */
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'table' | 'number';

/**
 * Dataset for chart rendering
 */
export interface ChartDataset {
	/** Label for this dataset */
	label: string;
	/** Data points */
	data: number[];
	/** Additional properties specific to the charting library */
	[key: string]: unknown;
}

/**
 * Generic chart data structure compatible with most charting libraries
 */
export interface ChartData {
	/** Labels for the x-axis or categories */
	labels: string[];
	/** Array of datasets to plot */
	datasets: ChartDataset[];
}

/**
 * Table data for table chart type
 */
export interface TableData {
	/** Column definitions */
	columns: Array<{
		key: string;
		title: string;
		shortTitle: string;
		type: string;
	}>;
	/** Row data */
	rows: Array<Record<string, string | number | boolean>>;
}

/**
 * Number data for single value display
 */
export interface NumberData {
	/** The value to display */
	value: number | string;
	/** Optional label */
	label?: string;
}

/**
 * Interface for chart adapters that transform CubeJS ResultSet data
 * into format suitable for specific charting libraries.
 */
export interface ChartAdapter {
	/**
	 * Transform a ResultSet into chart data format
	 *
	 * @param resultSet - The CubeJS ResultSet
	 * @param chartType - The type of chart to render
	 * @param pivotConfig - Optional pivot configuration
	 * @returns Chart data in the format expected by the charting library
	 */
	transformData(
		resultSet: ResultSet,
		chartType: ChartType,
		pivotConfig?: PivotConfig
	): ChartData | TableData | NumberData;

	/**
	 * Get default chart options for a specific chart type
	 *
	 * @param chartType - The type of chart
	 * @returns Default options for the charting library
	 */
	getDefaultOptions?(chartType: ChartType): Record<string, unknown>;
}

/**
 * Helper function to extract series names from a ResultSet
 */
export function getSeriesNames(resultSet: ResultSet, pivotConfig?: PivotConfig): string[] {
	return resultSet.seriesNames(pivotConfig).map((s) => s.title);
}

/**
 * Helper function to extract labels from a ResultSet
 */
export function getLabels(resultSet: ResultSet, pivotConfig?: PivotConfig): string[] {
	return resultSet.chartPivot(pivotConfig).map((row) => row.x);
}
