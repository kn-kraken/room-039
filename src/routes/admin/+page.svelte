<script lang="ts">
	let { data } = $props();
</script>

<div class="flex items-start justify-center gap-3">
	<div class="flex flex-col gap-2 bg-stone-100 rounded-md p-3">
		{#each data.reservations as reservation}
			<form method="POST">
				<div>{reservation.firstname} {reservation.surname}</div>
				<div>{reservation.date}</div>
				<div>{reservation.start_time}-{reservation.end_time}</div>
				<input type="hidden" name="id" value={reservation.id} />
				<button formaction="?/confirm" class="text-green-500">Akceptuj</button>
				<button formaction="?/cancel" class="text-red-500">Odrzuc</button>
			</form>
		{/each}
	</div>
	<form method="POST" action="?/export" class="flex flex-col bg-stone-100 rounded-md p-3 gap-2">
		<div class="">Guzik dla karola</div>
		<input type="date" name="from" />
		<input type="date" name="to" />
		<button class="bg-stone-300 rounded-sm p-1">Eksport</button>
	</form>
	<form method="POST" action="?/add_project" class="flex flex-col bg-stone-100 rounded-md gap-2 p-3">
		<div class="">Dodaj projekt</div>
		<div>
		<div class="text-stone-700 text-sm">Nazwa</div>
		<input class="border border-stone-400" name="name" />
		</div>
		<div>
		<div class="text-stone-700 text-sm">Emotikon</div>
		<input class="border border-stone-400" name="emoji" />
		</div>
		<button class="bg-stone-300 rounded-sm p-1">Dodaj</button>
	</form>
</div>
