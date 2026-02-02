# cubejs-client-svelte

A Svelte 5 client library for [Cube.js](https://cube.dev/) analytics. Provides reactive bindings, query builders, and chart adapters for seamless Cube.js integration.

## Installation

```bash
npm install cubejs-client-svelte @cubejs-client/core
```

## Quick Start

### 1. Set up the Provider

Wrap your app with `CubeProvider`:

```svelte
<script>
  import { CubeProvider } from 'cubejs-client-svelte';
</script>

<CubeProvider apiUrl="https://your-cube-api.com" apiToken="your-token">
  {#snippet children()}
    <App />
  {/snippet}
</CubeProvider>
```

### 2. Query Data

Use `createCubeQuery` for reactive queries:

```svelte
<script>
  import { createCubeQuery } from 'cubejs-client-svelte';

  const result = createCubeQuery({
    measures: ['Orders.count'],
    dimensions: ['Orders.status'],
    timeDimensions: [{
      dimension: 'Orders.createdAt',
      granularity: 'month'
    }]
  });
</script>

{#if result.loading}
  <p>Loading...</p>
{:else if result.error}
  <p>Error: {result.error.message}</p>
{:else if result.data}
  <pre>{JSON.stringify(result.data.tablePivot(), null, 2)}</pre>
{/if}
```

### 3. Using QueryRenderer Component

For a more declarative approach:

```svelte
<script>
  import { QueryRenderer } from 'cubejs-client-svelte';

  const query = {
    measures: ['Orders.count'],
    dimensions: ['Orders.status']
  };
</script>

<QueryRenderer {query}>
  {#snippet loading()}
    <p>Loading...</p>
  {/snippet}
  {#snippet error(err)}
    <p>Error: {err.message}</p>
  {/snippet}
  {#snippet success(resultSet)}
    <pre>{JSON.stringify(resultSet.tablePivot(), null, 2)}</pre>
  {/snippet}
</QueryRenderer>
```

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `CubeProvider` | Context provider that initializes the Cube.js client |
| `QueryRenderer` | Declarative query execution with loading/error/success slots |
| `QueryBuilder` | Interactive query builder UI component |

### Query Functions

| Function | Description |
|----------|-------------|
| `createCubeQuery(query, options?)` | Execute a Cube.js query with reactive state |
| `createCubeMeta(options?)` | Fetch metadata about available cubes |
| `createDryRun(query, options?)` | Validate a query without executing |
| `createLazyDryRun(options?)` | Lazy validation triggered manually |
| `createCubeSql(query, options?)` | Get generated SQL for a query |
| `createQueryBuilder(options?)` | Create a query builder state machine |

All query functions accept SSR options (`ssr`, `initialData`/`initialMeta`). See [SSR Compatibility](#ssr-compatibility) for details.

### Context Functions

| Function | Description |
|----------|-------------|
| `getCubeClient()` | Get the Cube.js client from context (throws if not found) |
| `tryGetCubeClient()` | Get the client or undefined |
| `setCubeClient(client)` | Set the client in context |

### Chart Adapter

Transform Cube.js results for charting libraries:

```typescript
import { chartJsAdapter } from 'cubejs-client-svelte/charts/chartjs';

const chartData = chartJsAdapter.transformData(resultSet, 'bar');
```

Supported chart types: `'line'`, `'bar'`, `'area'`, `'pie'`, `'table'`, `'number'`

## Reactive Queries

Queries can be reactive by passing a function:

```svelte
<script>
  import { createCubeQuery } from 'cubejs-client-svelte';

  let selectedStatus = $state('active');

  const result = createCubeQuery(() => ({
    measures: ['Orders.count'],
    filters: [{
      member: 'Orders.status',
      operator: 'equals',
      values: [selectedStatus]
    }]
  }));
</script>

<!-- Query automatically re-executes when selectedStatus changes -->
<select bind:value={selectedStatus}>
  <option value="active">Active</option>
  <option value="completed">Completed</option>
</select>
```

## SSR Compatibility

All query functions are SSR-safe by default. Queries only execute in the browser, preventing server-side blocking during SSR.

### Default Behavior (Client-Side Only)

By default, queries skip execution on the server and run only after hydration:

```svelte
<script>
  import { createCubeQuery } from 'cubejs-client-svelte';

  // This query will NOT execute during SSR - safe by default
  const result = createCubeQuery({
    measures: ['Orders.count']
  });
</script>
```

### Server-Side Data Fetching with Hydration

For optimal performance, fetch data in your `+page.server.ts` and pass it to components:

```typescript
// +page.server.ts
import cubejs from '@cubejs-client/core';

export async function load() {
  const cube = cubejs('your-token', { apiUrl: 'https://your-cube-api.com' });
  const resultSet = await cube.load({ measures: ['Orders.count'] });

  return {
    // Serialize the result for transfer to client
    initialData: resultSet
  };
}
```

```svelte
<!-- +page.svelte -->
<script>
  import { createCubeQuery } from 'cubejs-client-svelte';

  let { data } = $props();

  // Hydrate with server-fetched data - no duplicate fetch on client
  const result = createCubeQuery(
    { measures: ['Orders.count'] },
    { initialData: data.initialData }
  );
</script>

{#if result.data}
  <p>Orders: {result.data.tablePivot()[0]['Orders.count']}</p>
{/if}
```

### SSR Options

All query functions accept these SSR-related options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ssr` | `boolean` | `false` | Execute query on server during SSR |
| `initialData` | `ResultSet` | - | Pre-fetched data for hydration (createCubeQuery) |
| `initialMeta` | `Meta` | - | Pre-fetched metadata for hydration (createCubeMeta, createQueryBuilder) |

### Force Server-Side Execution

If you need queries to execute during SSR (not recommended for most cases):

```svelte
<script>
  const result = createCubeQuery(
    { measures: ['Orders.count'] },
    { ssr: true }  // Will execute on server - use with caution
  );
</script>
```

## Requirements

- Svelte 5.0+
- @cubejs-client/core 0.36+

## License

MIT
