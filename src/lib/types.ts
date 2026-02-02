import type {
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
} from '@cubejs-client/core';

// Re-export core types
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
};

/**
 * Props for the CubeProvider component
 */
export interface CubeProviderProps {
	/** API token or function returning a promise that resolves to a token */
	apiToken: string | (() => Promise<string>);
	/** CubeJS API URL */
	apiUrl: string;
	/** Additional CubeJS API options */
	options?: Omit<CubeApiOptions, 'apiUrl'>;
}

/**
 * Generic state for async operations
 */
export interface QueryState<T = ResultSet> {
	/** The query result data */
	readonly data: T | null;
	/** Whether the query is currently loading */
	readonly loading: boolean;
	/** Any error that occurred during the query */
	readonly error: Error | null;
	/** Function to re-execute the query */
	readonly refetch: () => Promise<void>;
}

/**
 * State for metadata queries
 */
export interface MetaState {
	/** The metadata result */
	readonly meta: Meta | null;
	/** Whether the metadata is loading */
	readonly loading: boolean;
	/** Any error that occurred */
	readonly error: Error | null;
	/** Function to refresh the metadata */
	readonly refetch: () => Promise<void>;
}

/**
 * State for dry run queries
 */
export interface DryRunState {
	/** The dry run result containing query normalization info */
	readonly result: DryRunResponse | null;
	/** Whether the dry run is loading */
	readonly loading: boolean;
	/** Any error that occurred */
	readonly error: Error | null;
	/** Function to re-run the dry run */
	readonly refetch: () => Promise<void>;
}

/**
 * State for lazy dry run queries (manual trigger)
 */
export interface LazyDryRunState extends DryRunState {
	/** Function to manually trigger the dry run */
	readonly run: (query: Query) => Promise<void>;
}

/**
 * Base SSR options for all query functions
 */
export interface SSROptions {
	/**
	 * Whether to execute the query on the server during SSR.
	 * Default: false (queries only run on client)
	 *
	 * Set to true only if you want the query to execute during server-side rendering.
	 * For most use cases, leave this as false and use initialData for hydration.
	 */
	ssr?: boolean;
}

/**
 * Options for creating queries
 */
export interface CreateQueryOptions extends LoadMethodOptions, SSROptions {
	/** Override the client from context */
	client?: CubeApi;
	/** Skip executing the query */
	skip?: boolean;
	/**
	 * Pre-fetched data for SSR hydration.
	 * When provided, the query will use this data initially and skip the first fetch.
	 * Useful for passing data fetched in +page.server.ts to the component.
	 */
	initialData?: ResultSet;
}

/**
 * Options for creating metadata queries
 */
export interface CreateMetaOptions extends SSROptions {
	/** Override the client from context */
	client?: CubeApi;
	/**
	 * Pre-fetched metadata for SSR hydration.
	 * When provided, the metadata will use this data initially and skip the first fetch.
	 */
	initialMeta?: Meta;
}

/**
 * Options for dry run queries
 */
export interface CreateDryRunOptions extends SSROptions {
	/** Override the client from context */
	client?: CubeApi;
}

/**
 * Options for SQL queries
 */
export interface CreateSqlOptions extends SSROptions {
	/** Override the client from context */
	client?: CubeApi;
}

/**
 * Chart type enum
 */
export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'table' | 'number';

/**
 * Available member for query builder
 */
export interface AvailableMember {
	name: string;
	title: string;
	shortTitle: string;
	type: string;
	isVisible?: boolean;
}

/**
 * Order direction
 */
export type OrderDirection = 'asc' | 'desc';

/**
 * Order item
 */
export type OrderItem = [string, OrderDirection];

/**
 * Query builder state
 */
export interface QueryBuilderState {
	// Current selections
	readonly measures: string[];
	readonly dimensions: string[];
	readonly segments: string[];
	readonly timeDimensions: TimeDimension[];
	readonly filters: Filter[];
	readonly order: OrderItem[];
	readonly chartType: ChartType;
	readonly limit: number | undefined;
	readonly offset: number | undefined;
	readonly timezone: string | undefined;
	readonly renewQuery: boolean;

	// Available members from metadata
	readonly availableMeasures: AvailableMember[];
	readonly availableDimensions: AvailableMember[];
	readonly availableSegments: AvailableMember[];
	readonly availableTimeDimensions: AvailableMember[];

	// Derived query object
	readonly query: Query;

	// Loading state for metadata
	readonly isMetaLoading: boolean;
	readonly metaError: Error | null;
}

/**
 * Query builder actions
 */
export interface QueryBuilderActions {
	// Measure actions
	addMeasure: (measure: string) => void;
	removeMeasure: (measure: string) => void;
	updateMeasure: (oldMeasure: string, newMeasure: string) => void;
	setMeasures: (measures: string[]) => void;

	// Dimension actions
	addDimension: (dimension: string) => void;
	removeDimension: (dimension: string) => void;
	updateDimension: (oldDimension: string, newDimension: string) => void;
	setDimensions: (dimensions: string[]) => void;

	// Segment actions
	addSegment: (segment: string) => void;
	removeSegment: (segment: string) => void;
	setSegments: (segments: string[]) => void;

	// Time dimension actions
	addTimeDimension: (timeDimension: TimeDimension) => void;
	removeTimeDimension: (dimension: string) => void;
	updateTimeDimension: (dimension: string, updates: Partial<TimeDimension>) => void;
	setTimeDimensions: (timeDimensions: TimeDimension[]) => void;

	// Filter actions
	addFilter: (filter: Filter) => void;
	removeFilter: (index: number) => void;
	updateFilter: (index: number, filter: Filter) => void;
	setFilters: (filters: Filter[]) => void;

	// Order actions
	setOrder: (order: OrderItem[]) => void;

	// Other setters
	setChartType: (chartType: ChartType) => void;
	setLimit: (limit: number | undefined) => void;
	setOffset: (offset: number | undefined) => void;
	setTimezone: (timezone: string | undefined) => void;
	setRenewQuery: (renewQuery: boolean) => void;

	// Reset
	reset: () => void;
}

/**
 * Full query builder return type
 */
export type QueryBuilder = QueryBuilderState & QueryBuilderActions;

/**
 * Options for query builder
 */
export interface QueryBuilderOptions extends SSROptions {
	/** Override the client from context */
	client?: CubeApi;
	/** Initial query to populate the builder */
	initialQuery?: Query;
	/** Initial chart type */
	initialChartType?: ChartType;
	/**
	 * Pre-fetched metadata for SSR hydration.
	 * When provided, the query builder will use this metadata initially and skip the first fetch.
	 */
	initialMeta?: Meta;
}
