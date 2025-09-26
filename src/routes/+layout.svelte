<script lang="ts">
	import '../app.css';
	import IconButton from '$lib/IconButton.svelte';
	import signOut from '../assets/sign-out.svg';

	let { children, data } = $props();
</script>

<div class="flex h-screen flex-col gap-8 bg-stone-200">
	<div class="bg-graphite flex h-16 items-center shadow-xs">
		<div class="font-radikal-wut text-sapphire flex h-full items-center">
			<div class="px-4 text-3xl">039</div>
			<!-- <div class="bg-sapphire mx-4 h-6"></div> -->
			<div class="text-lg leading-tight">
				Wydział Elektroniki <br /> i Technik Informacyjnych
			</div>
		</div>
		<div class="text-heather ml-auto text-lg">
			{data.userData.name}
		</div>
		<IconButton
			class="bg-heather h-6 w-6 px-6"
			icon={signOut}
			onclick={() => console.log('sign out')}
		/>
	</div>
	{@render children()}
</div>
