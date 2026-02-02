// Components
export { default as CubeProvider } from './CubeProvider.svelte';
export { default as QueryRenderer } from './components/QueryRenderer.svelte';
export { default as QueryBuilder } from './components/QueryBuilder.svelte';

// Query functions
export { createCubeQuery } from './query/createCubeQuery.svelte.js';
export { createCubeMeta } from './query/createCubeMeta.svelte.js';
export { createDryRun, createLazyDryRun } from './query/createDryRun.svelte.js';
export { createCubeSql } from './query/createCubeSql.svelte.js';

// Query builder
export { createQueryBuilder } from './builder/createQueryBuilder.svelte.js';

// Context utilities
export {
	getCubeClient,
	setCubeClient,
	tryGetCubeClient,
	setCubeClientContext,
	CUBE_CLIENT_KEY,
	type CubeClientContext
} from './context.svelte.js';

// Chart adapter types and helpers
export type {
	ChartAdapter,
	ChartData,
	ChartDataset,
	TableData,
	NumberData,
	ChartType as AdapterChartType
} from './charts/adapter.js';
export { getSeriesNames, getLabels } from './charts/adapter.js';

// Utilities
export { isQueryPresent } from './utils/isQueryPresent.js';

// Types - re-export from core
export type {
	CubeApi,
	Query,
	ResultSet,
	Meta,
	LoadMethodOptions,
	CubeApiOptions,
	PivotConfig,
	TCubeMember,
	TCubeMeasure,
	TCubeDimension,
	TCubeSegment,
	TimeDimensionGranularity,
	Filter,
	TimeDimension,
	DryRunResponse
} from './types.js';

// Types - library specific
export type {
	CubeProviderProps,
	QueryState,
	MetaState,
	DryRunState,
	LazyDryRunState,
	CreateQueryOptions,
	CreateMetaOptions,
	CreateDryRunOptions,
	CreateSqlOptions,
	ChartType,
	AvailableMember,
	OrderDirection,
	OrderItem,
	QueryBuilderState,
	QueryBuilderActions,
	QueryBuilder as QueryBuilderType,
	QueryBuilderOptions
} from './types.js';

// SQL state type from createCubeSql
export type { SqlState } from './query/createCubeSql.svelte.js';
