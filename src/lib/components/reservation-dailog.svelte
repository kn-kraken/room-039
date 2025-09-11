<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let { open = $bindable(false), onAccept } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Regulamin</Dialog.Title>
			<Dialog.Description>
				Proszę przeczytać i zaakceptować nasz regulamin, aby kontynuować korzystanie z aplikacji.
				Akceptując, wyrażasz zgodę na nasze zasady wykorzystania danych i <a
					class="text-sapphire underline"
					target="_blank"
					href="/regulamin">warunki usługi</a
				>.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer></Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
