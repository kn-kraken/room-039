<script lang="ts">
	import { onMount } from 'svelte';
	import signOut from '../assets/sign-out.svg';
	import IconButton from '$lib/IconButton.svelte';
	import AlertDialog from '$lib/components/toc-dialog.svelte';
	import TocDialog from '$lib/components/toc-dialog.svelte';

	let { data } = $props();
	const { userData } = data;

	let openToC = $state(false);
	onMount(() => {
		console.log(userData);
		if (userData.hasAcceptedTerms) {
			openToC = false;
		} else {
			openToC = true;
		}
	});

	async function handleAcceptTerms() {
		const formData = new FormData();
		formData.append('id', userData.id.toString());
		const response = await fetch('?/acceptTerms', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			openToC = false;
		}
	}

	function getDays() {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const days = [];
		for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
			days.push(new Date(date));
		}
		return days;
	}

	const days = getDays();

	const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
	const events = {
		'3': [
			{ name: 'Some event', start: 10, end: 12 },
			{ name: 'Some other event', start: 11, end: 16 }
		]
	};
	const hours = Array.from({ length: 25 }, (_, i) => i);
</script>

<div class="flex h-full flex-col gap-8 bg-stone-200">
	<div class="bg-graphite flex h-16 items-center shadow-xs">
		<div class="font-radikal-wut text-sapphire flex h-full items-center">
			<div class="px-4 text-3xl">039</div>
			<!-- <div class="bg-sapphire mx-4 h-6"></div> -->
			<div class="text-lg leading-tight">
				Wydział Elektroniki <br /> i Technik Informacyjnych
			</div>
		</div>
		<div class="text-heather ml-auto text-lg">
			{userData.name}
		</div>
		<IconButton
			class="bg-heather h-6 w-6 px-6"
			icon={signOut}
			onclick={() => console.log('sign out')}
		/>
	</div>
	<div class="self-center text-2xl">May 2025</div>
	<div class="self-center">
		<div class="self-center rounded-md bg-stone-100 p-3 shadow-md">
			<div class="grid grid-cols-7 gap-2">
				{#each weekDays as day}
					<div class="w-28 flex-1 pl-0.5">
						{day}
					</div>
				{/each}
				{#each days as day}
					<div
						class="flex h-20 w-28 cursor-pointer flex-col overflow-hidden rounded-xs bg-stone-200 hover:bg-stone-300"
					>
						<div class="px-2 py-1 text-sm text-stone-600 italic">
							{day.getDate()}
						</div>
						<div class="mt-auto flex flex-col gap-0.5 overflow-auto">
							{#each events[day.getDate()] as event}
								<div class="bg-sapphire rounded-md px-0.5 text-sm text-white">
									{event.name}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div class="overflow-hidden p-6">
			<div class="relative mt-6 flex h-40 flex-col gap-0.5">
				{#each hours as hour, i}
					<div
						class="absolute h-full w-full border-l border-stone-400"
						style="translate: calc({(i * 100) / 24}%)"
					>
						<div class="absolute bottom-full -translate-x-1/2">{hour}</div>
					</div>
				{/each}
				{#each events['3'] as event}
					<div class="w-full" style="translate: calc({(event.start * 100) / 24}%)">
						<div class="h-6 w-48">
							<div class="bg-sapphire mx-[0.5px] h-full rounded-xs">
								{event.name}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div>
			<input type="time" />
			<input type="time" />
		</div>
	</div>
	<div class="bg-graphite text-sapphire mt-auto flex h-6 items-center shadow-xs">
		Created by the kraken bois
	</div>
	<TocDialog bind:open={openToC} onAccept={handleAcceptTerms} />
</div>
