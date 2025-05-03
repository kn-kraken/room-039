<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { icon, style, ...rest }: { icon: string } & HTMLButtonAttributes = $props();
</script>

<button {...rest} style="background-image: url({icon}); {style}"></button>

<style>
	button {
		width: 24px;
		height: 24px;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}
</style>
