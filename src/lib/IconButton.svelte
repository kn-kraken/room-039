<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let { icon, style, ...rest }: { icon: string } & HTMLButtonAttributes = $props();
</script>

<button {...rest} style="mask-image: url({icon}); {style}"></button>

<style>
	button {
		mask-size: contain;
		mask-repeat: no-repeat;
		mask-position: center;
	}
</style>
