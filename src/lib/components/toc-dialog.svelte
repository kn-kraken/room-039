<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';

	let { open = $bindable(false), onAccept } = $props();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Regulamin</AlertDialog.Title>
			<AlertDialog.Description>
				Proszę przeczytać i zaakceptować nasz regulamin, aby kontynuować korzystanie z aplikacji.
				Akceptując, wyrażasz zgodę na nasze zasady wykorzystania danych i <a
					class="text-sapphire underline"
					target="_blank"
					href="/regulamin">warunki usługi</a
				>.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Action onclick={onAccept}>Zaakceptuj regulamin</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
