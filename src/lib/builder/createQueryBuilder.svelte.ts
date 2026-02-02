import type { Query, Filter, TimeDimension, Meta } from '@cubejs-client/core';
import { tryGetCubeClient } from '../context.svelte.js';
import type {
	QueryBuilder,
	QueryBuilderOptions,
	ChartType,
	OrderItem,
	AvailableMember
} from '../types.js';
import { isBrowser } from '../utils/isBrowser.js';

/**
 * Creates a reactive query builder for constructing CubeJS queries.
 *
 * Provides a comprehensive API for building queries with measures, dimensions,
 * filters, time dimensions, and ordering. Automatically fetches available
 * members from cube metadata.
 *
 * @param options - Optional configuration including client override and initial values
 * @returns A reactive QueryBuilder object with state and actions
 *
 * @example
 * ```svelte
 * <script>
 *   import { createQueryBuilder } from 'cubejs-client-svelte';
 *
 *   const builder = createQueryBuilder({
 *     initialChartType: 'bar'
 *   });
 *
 *   // Add a measure
 *   builder.addMeasure('Orders.count');
 *
 *   // Add a dimension
 *   builder.addDimension('Orders.status');
 *
 *   // The query is automatically derived
 *   $: console.log(builder.query);
 * </script>
 *
 * <select onchange={(e) => builder.addMeasure(e.target.value)}>
 *   {#each builder.availableMeasures as measure}
 *     <option value={measure.name}>{measure.title}</option>
 *   {/each}
 * </select>
 * ```
 */
export function createQueryBuilder(options: QueryBuilderOptions = {}): QueryBuilder {
	const { client: clientOverride, initialQuery, initialChartType = 'line', ssr = false, initialMeta } = options;

	// Get client from context or use override
	const contextClient = tryGetCubeClient();
	const client = clientOverride ?? contextClient;

	if (!client) {
		throw new Error(
			'No CubeJS client available. Either wrap your component with CubeProvider or pass a client in options.'
		);
	}

	// Extract initial values from initialQuery
	const initialMeasures = initialQuery?.measures ?? [];
	const initialDimensions = initialQuery?.dimensions ?? [];
	const initialSegments = initialQuery?.segments ?? [];
	const initialTimeDimensions = initialQuery?.timeDimensions ?? [];
	const initialFilters = (initialQuery?.filters ?? []) as Filter[];
	const initialOrder = normalizeOrder(initialQuery?.order);
	const initialLimit = initialQuery?.limit ?? undefined;
	const initialOffset = initialQuery?.offset ?? undefined;
	const initialTimezone = initialQuery?.timezone ?? undefined;
	const initialRenewQuery = initialQuery?.renewQuery ?? false;

	// Reactive state for query components
	let measures = $state<string[]>([...initialMeasures]);
	let dimensions = $state<string[]>([...initialDimensions]);
	let segments = $state<string[]>([...initialSegments]);
	let timeDimensions = $state<TimeDimension[]>([...initialTimeDimensions]);
	let filters = $state<Filter[]>([...initialFilters]);
	let order = $state<OrderItem[]>([...initialOrder]);
	let chartType = $state<ChartType>(initialChartType);
	let limit = $state<number | undefined>(initialLimit);
	let offset = $state<number | undefined>(initialOffset);
	let timezone = $state<string | undefined>(initialTimezone);
	let renewQuery = $state<boolean>(initialRenewQuery);

	// Metadata state - initialize with initialMeta if provided
	let meta = $state<Meta | null>(initialMeta ?? null);
	let isMetaLoading = $state(false);
	let metaError = $state<Error | null>(null);

	// Track if we've had a manual refetch (to allow re-fetching even with initialMeta)
	let hasRefetched = false;

	// Version counter for race condition handling
	let metaRequestVersion = 0;

	// Fetch metadata with version tracking to prevent race conditions
	const fetchMeta = async (version: number): Promise<void> => {
		isMetaLoading = true;
		metaError = null;

		try {
			const result = await client.meta();
			// Only update state if this is still the latest request
			if (version === metaRequestVersion) {
				meta = result;
			}
		} catch (e) {
			// Only update state if this is still the latest request
			if (version === metaRequestVersion) {
				metaError = e instanceof Error ? e : new Error(String(e));
				meta = null;
			}
		} finally {
			// Only update state if this is still the latest request
			if (version === metaRequestVersion) {
				isMetaLoading = false;
			}
		}
	};

	// Refetch metadata function - always executes regardless of SSR settings
	const refetchMeta = async (): Promise<void> => {
		hasRefetched = true;
		metaRequestVersion++;
		await fetchMeta(metaRequestVersion);
	};

	// Auto-fetch metadata on creation
	$effect(() => {
		// Skip on server unless ssr option is true
		if (!isBrowser() && !ssr) {
			return;
		}

		// Skip initial fetch if initialMeta was provided and we haven't manually refetched
		if (initialMeta && !hasRefetched) {
			return;
		}

		metaRequestVersion++;
		fetchMeta(metaRequestVersion);
	});

	// Derived available members from metadata
	const availableMeasures = $derived<AvailableMember[]>(
		meta?.cubes.flatMap((cube) =>
			cube.measures.map((m) => ({
				name: m.name,
				title: m.title,
				shortTitle: m.shortTitle,
				type: m.type,
				isVisible: m.public ?? m.isVisible
			}))
		) ?? []
	);

	const availableDimensions = $derived<AvailableMember[]>(
		meta?.cubes.flatMap((cube) =>
			cube.dimensions
				.filter((d) => d.type !== 'time')
				.map((d) => ({
					name: d.name,
					title: d.title,
					shortTitle: d.shortTitle,
					type: d.type,
					isVisible: d.public ?? d.isVisible
				}))
		) ?? []
	);

	const availableTimeDimensions = $derived<AvailableMember[]>(
		meta?.cubes.flatMap((cube) =>
			cube.dimensions
				.filter((d) => d.type === 'time')
				.map((d) => ({
					name: d.name,
					title: d.title,
					shortTitle: d.shortTitle,
					type: d.type,
					isVisible: d.public ?? d.isVisible
				}))
		) ?? []
	);

	const availableSegments = $derived<AvailableMember[]>(
		meta?.cubes.flatMap((cube) =>
			cube.segments.map((s) => ({
				name: s.name,
				title: s.title,
				shortTitle: s.shortTitle,
				type: 'segment',
				isVisible: s.public ?? s.isVisible
			}))
		) ?? []
	);

	// Derived query object
	const query = $derived<Query>({
		...(measures.length > 0 && { measures }),
		...(dimensions.length > 0 && { dimensions }),
		...(segments.length > 0 && { segments }),
		...(timeDimensions.length > 0 && { timeDimensions }),
		...(filters.length > 0 && { filters }),
		...(order.length > 0 && { order }),
		...(limit !== undefined && { limit }),
		...(offset !== undefined && { offset }),
		...(timezone !== undefined && { timezone }),
		...(renewQuery && { renewQuery })
	});

	// Measure actions
	const addMeasure = (measure: string): void => {
		if (!measures.includes(measure)) {
			measures = [...measures, measure];
		}
	};

	const removeMeasure = (measure: string): void => {
		measures = measures.filter((m) => m !== measure);
	};

	const updateMeasure = (oldMeasure: string, newMeasure: string): void => {
		measures = measures.map((m) => (m === oldMeasure ? newMeasure : m));
	};

	const setMeasures = (newMeasures: string[]): void => {
		measures = [...newMeasures];
	};

	// Dimension actions
	const addDimension = (dimension: string): void => {
		if (!dimensions.includes(dimension)) {
			dimensions = [...dimensions, dimension];
		}
	};

	const removeDimension = (dimension: string): void => {
		dimensions = dimensions.filter((d) => d !== dimension);
	};

	const updateDimension = (oldDimension: string, newDimension: string): void => {
		dimensions = dimensions.map((d) => (d === oldDimension ? newDimension : d));
	};

	const setDimensions = (newDimensions: string[]): void => {
		dimensions = [...newDimensions];
	};

	// Segment actions
	const addSegment = (segment: string): void => {
		if (!segments.includes(segment)) {
			segments = [...segments, segment];
		}
	};

	const removeSegment = (segment: string): void => {
		segments = segments.filter((s) => s !== segment);
	};

	const setSegments = (newSegments: string[]): void => {
		segments = [...newSegments];
	};

	// Time dimension actions
	const addTimeDimension = (timeDimension: TimeDimension): void => {
		// Check if already exists by dimension name
		const exists = timeDimensions.some((td) => td.dimension === timeDimension.dimension);
		if (!exists) {
			timeDimensions = [...timeDimensions, timeDimension];
		}
	};

	const removeTimeDimension = (dimension: string): void => {
		timeDimensions = timeDimensions.filter((td) => td.dimension !== dimension);
	};

	const updateTimeDimension = (dimension: string, updates: Partial<TimeDimension>): void => {
		timeDimensions = timeDimensions.map((td) =>
			td.dimension === dimension ? { ...td, ...updates } : td
		);
	};

	const setTimeDimensions = (newTimeDimensions: TimeDimension[]): void => {
		timeDimensions = [...newTimeDimensions];
	};

	// Filter actions
	const addFilter = (filter: Filter): void => {
		filters = [...filters, filter];
	};

	const removeFilter = (index: number): void => {
		filters = filters.filter((_, i) => i !== index);
	};

	const updateFilter = (index: number, filter: Filter): void => {
		filters = filters.map((f, i) => (i === index ? filter : f));
	};

	const setFilters = (newFilters: Filter[]): void => {
		filters = [...newFilters];
	};

	// Order actions
	const setOrder = (newOrder: OrderItem[]): void => {
		order = [...newOrder];
	};

	// Other setters
	const setChartType = (newChartType: ChartType): void => {
		chartType = newChartType;
	};

	const setLimit = (newLimit: number | undefined): void => {
		limit = newLimit;
	};

	const setOffset = (newOffset: number | undefined): void => {
		offset = newOffset;
	};

	const setTimezone = (newTimezone: string | undefined): void => {
		timezone = newTimezone;
	};

	const setRenewQuery = (newRenewQuery: boolean): void => {
		renewQuery = newRenewQuery;
	};

	// Reset to initial state
	const reset = (): void => {
		measures = [...initialMeasures];
		dimensions = [...initialDimensions];
		segments = [...initialSegments];
		timeDimensions = [...initialTimeDimensions];
		filters = [...initialFilters];
		order = [...initialOrder];
		chartType = initialChartType;
		limit = initialLimit;
		offset = initialOffset;
		timezone = initialTimezone;
		renewQuery = initialRenewQuery;
	};

	// Return the query builder object
	return {
		// State getters
		get measures() {
			return measures;
		},
		get dimensions() {
			return dimensions;
		},
		get segments() {
			return segments;
		},
		get timeDimensions() {
			return timeDimensions;
		},
		get filters() {
			return filters;
		},
		get order() {
			return order;
		},
		get chartType() {
			return chartType;
		},
		get limit() {
			return limit;
		},
		get offset() {
			return offset;
		},
		get timezone() {
			return timezone;
		},
		get renewQuery() {
			return renewQuery;
		},

		// Available members
		get availableMeasures() {
			return availableMeasures;
		},
		get availableDimensions() {
			return availableDimensions;
		},
		get availableSegments() {
			return availableSegments;
		},
		get availableTimeDimensions() {
			return availableTimeDimensions;
		},

		// Derived query
		get query() {
			return query;
		},

		// Loading state
		get isMetaLoading() {
			return isMetaLoading;
		},
		get metaError() {
			return metaError;
		},

		// Actions
		addMeasure,
		removeMeasure,
		updateMeasure,
		setMeasures,
		addDimension,
		removeDimension,
		updateDimension,
		setDimensions,
		addSegment,
		removeSegment,
		setSegments,
		addTimeDimension,
		removeTimeDimension,
		updateTimeDimension,
		setTimeDimensions,
		addFilter,
		removeFilter,
		updateFilter,
		setFilters,
		setOrder,
		setChartType,
		setLimit,
		setOffset,
		setTimezone,
		setRenewQuery,
		reset
	};
}

/**
 * Type guard to check if an item is a valid OrderItem
 */
function isOrderItem(item: unknown): item is OrderItem {
	return (
		Array.isArray(item) &&
		item.length === 2 &&
		typeof item[0] === 'string' &&
		(item[1] === 'asc' || item[1] === 'desc')
	);
}

/**
 * Normalize order from Query format to OrderItem[] format
 */
function normalizeOrder(order: Query['order'] | undefined): OrderItem[] {
	if (!order) return [];

	if (Array.isArray(order)) {
		// Validate each item before including it
		return order.filter(isOrderItem);
	}

	// Object format - convert to array with validation
	return Object.entries(order)
		.filter(([, dir]) => dir === 'asc' || dir === 'desc')
		.map(([key, direction]) => [key, direction] as OrderItem);
}
