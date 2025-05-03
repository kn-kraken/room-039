<script lang="ts">
	import { onMount } from 'svelte';
	import signOut from '../assets/sign-out.svg';
	import IconButton from '$lib/IconButton.svelte';

	let { data } = $props();

	onMount(() => {
		console.log(data);
	});

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
		'3': ['Some event', 'Some other event', 'More events']
	};
</script>

<div class="flex h-full flex-col gap-8 bg-stone-200">
	<div class="flex h-12 items-center bg-primary shadow-sm">
		<div class="ml-auto">
			{data.name}
		</div>
		<IconButton icon={signOut} onclick={() => console.log('sign out')} />
	</div>
	<div class="self-center text-2xl">May 2025</div>
	<div class="self-center rounded-md bg-stone-100 p-3 shadow-md">
		<div class="grid grid-cols-7 gap-2">
			{#each weekDays as day}
				<div class="w-28 flex-1 pl-0.5">
					{day}
				</div>
			{/each}
			{#each days as day}
				<div class="flex h-20 w-28 flex-col overflow-hidden rounded-sm bg-stone-200">
					<div class="px-2 py-1 text-sm italic text-stone-600">
						{day.getDate()}
					</div>
					<div class="mt-auto flex flex-col gap-0.5">
						{#each events[day.getDate()] as event}
							<div class="rounded-md bg-cyan-600 px-0.5 text-sm text-white">
								{event}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
	<div class="mt-auto flex h-6 items-center bg-stone-400 shadow-sm">Bottom bar</div>
</div>
