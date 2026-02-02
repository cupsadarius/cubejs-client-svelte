<script lang="ts" module>
	// Module context for types only
	export type StateRef<T> = { current: T | null };
</script>

<script lang="ts" generics="T">
	interface Props {
		setup: () => T;
		stateRef: StateRef<T>;
	}

	let { setup, stateRef }: Props = $props();

	const state = setup();
	stateRef.current = state;
</script>

<div data-testid="test-wrapper"></div>
