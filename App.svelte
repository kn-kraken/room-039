<script lang="ts">
    import { onMount } from "svelte";

    let count = $state(0);
</script>

<button on:click={() => count++}>{count} a</button>
