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

  const { data, loading, error } = createCubeQuery({
    measures: ['Orders.count'],
    dimensions: ['Orders.status'],
    timeDimensions: [{
      dimension: 'Orders.createdAt',
      granularity: 'month'
    }]
  });
</script>

{#if $loading}
  <p>Loading...</p>
{:else if $error}
  <p>Error: {$error.message}</p>
{:else if $data}
  <pre>{JSON.stringify($data.tablePivot(), null, 2)}</pre>
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
| `createCubeQuery(query)` | Execute a Cube.js query with reactive state |
| `createCubeMeta()` | Fetch metadata about available cubes |
| `createDryRun(query)` | Validate a query without executing |
| `createLazyDryRun()` | Lazy validation triggered manually |
| `createCubeSql(query)` | Get generated SQL for a query |
| `createQueryBuilder(meta)` | Create a query builder state machine |

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
  let selectedStatus = $state('active');

  const { data } = createCubeQuery(() => ({
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

## Requirements

- Svelte 5.0+
- @cubejs-client/core 0.36+

## License

MIT
