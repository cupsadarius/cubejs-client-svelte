# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Svelte 5 client library for Cube.js analytics** (`cubejs-client-svelte`). It provides reactive bindings, query builders, and chart adapters to integrate Cube.js with Svelte applications.

## Development Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Build library for distribution (syncs SvelteKit + packages)
npm run check        # Type check with svelte-check
npm run check:watch  # Type check in watch mode
npm run test         # Run vitest unit tests
npm run lint         # Run ESLint
```

## Architecture

### Core Design: Reactive State with Svelte 5 Runes

The library uses Svelte 5's runes system (`$state`, `$effect`, `$derived`) for reactive state management. All query functions follow a consistent pattern:

1. Accept query (static or function) + optional client override
2. Return reactive state: `{ data/result, loading, error, refetch }`
3. Use version counters for race condition handling
4. Auto-execute on dependency changes via `$effect()`

### Key Components

```
src/lib/
├── CubeProvider.svelte        # Context provider - sets Cube client
├── context.svelte.ts          # Context management (setCubeClient/getCubeClient)
├── components/
│   ├── QueryRenderer.svelte   # Query execution wrapper with slots
│   └── QueryBuilder.svelte    # Interactive query builder UI
├── query/
│   ├── createCubeQuery.svelte.ts   # Main query function
│   ├── createCubeMeta.svelte.ts    # Metadata fetching
│   ├── createDryRun.svelte.ts      # Query validation (eager & lazy)
│   └── createCubeSql.svelte.ts     # SQL generation
├── builder/
│   └── createQueryBuilder.svelte.ts  # Query builder state machine
└── charts/
    ├── adapter.ts             # Chart adapter interface
    └── adapters/chartjs.ts    # Chart.js implementation
```

### Data Flow

```
CubeProvider (sets client in context)
    ↓
createCubeQuery / QueryRenderer
    ↓
    ├→ getCubeClient() from context
    ├→ isQueryPresent() validation
    ├→ client.load(query)
    └→ { data, loading, error, refetch }
        ↓
ResultSet → chartAdapter.transformData() → Chart
```

### Key Patterns

**Race Condition Handling**: All async operations use a `requestVersion` counter. Only the latest version's result updates state.

**Query Validation**: `isQueryPresent()` checks for at least one measure/dimension/timeDimension before API calls.

**State Updates**: Use spread operators (`measures = [...measures, newMeasure]`) to ensure Svelte reactivity.

## Build Output

- Library compiles to `dist/`
- Main entry: `dist/index.js` with types `dist/index.d.ts`
- Chart adapter sub-export: `./charts/chartjs`

## Dependencies

- **Svelte 5** with runes API
- **SvelteKit 2** for framework tooling
- **@cubejs-client/core** (peer dependency)
- **Vite 6** for builds
- **vitest** + **@testing-library/svelte** for testing
