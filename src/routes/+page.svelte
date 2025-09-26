<script lang="ts">
	import { onMount } from 'svelte';
	import IconButton from '$lib/IconButton.svelte';
	import TocDialog from '$lib/components/toc-dialog.svelte';
	import ReservationDialog from '$lib/components/reservation-dailog.svelte';
	import type { ReservationWithDetails, Section } from '$lib/db/index.js';

	let { data } = $props();
	const { userData, todayReservations, monthlyReservations, sections } = data;
	const typedSections = sections as Section[];
	console.log(todayReservations);

	let openToC = $state(false);
	let openReservationDialog = $state(false);
	let selectedDate: Date | null = $state(null);
	let selectedDateReservations: ReservationWithDetails[] = $state([]);

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

	async function handleDayClick(day: Date) {
		selectedDate = new Date(day);

		// Use local date formatting to avoid timezone issues
		const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

		// Fetch reservations for this date
		try {
			const response = await fetch(`/api/reservations/${dateString}`);
			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					selectedDateReservations = result.reservations || [];
				} else {
					selectedDateReservations = [];
				}
			} else {
				selectedDateReservations = [];
			}
		} catch (error) {
			console.error('Failed to fetch reservations:', error);
			selectedDateReservations = [];
		}

		openReservationDialog = true;
	}

	// Handle reservation updates (refresh data)
	async function handleReservationUpdated() {
		if (selectedDate) {
			const dateString = selectedDate.toISOString().split('T')[0];

			try {
				const response = await fetch(`/api/reservations/${dateString}`);
				if (response.ok) {
					const result = await response.json();
					if (result.success) {
						selectedDateReservations = result.reservations || [];

						// Update the monthly reservations data for this date
						if (result.reservations && result.reservations.length > 0) {
							monthlyReservations[dateString] = result.reservations;
						} else {
							delete monthlyReservations[dateString];
						}

						// Refresh the days data to update calendar display
						// This will automatically re-run the getDaysWithReservations function
						location.reload(); // Simple refresh for now, could be optimized
					}
				}
			} catch (error) {
				console.error('Failed to refresh reservations:', error);
			}
		}
	}

	function getDaysWithReservations() {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth();
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const days = [];

		// Use a simple loop with day numbers to avoid date object mutation issues
		for (let day = 1; day <= daysInMonth; day++) {
			const dayDate = new Date(year, month, day);

			// Create date string without timezone conversion issues
			const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

			// Get reservations for this day from monthly data
			const dayReservations = monthlyReservations[dateString] || [];

			// Count reservations by section - dynamic based on database sections
			let sectionCounts: Record<string, number> = {};
			typedSections.forEach((section) => {
				sectionCounts[section.section_name] = 0;
			});
			let hasReservations = dayReservations.length > 0;

			dayReservations.forEach((res) => {
				if (sectionCounts[res.section_name] !== undefined) {
					sectionCounts[res.section_name]++;
				}
			});

			days.push({
				date: dayDate,
				hasReservations,
				sectionCounts,
				reservations: dayReservations
			});
		}

		return days;
	}
	const days = getDaysWithReservations();

	const weekDays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

	// Define section colors - dynamic based on sections
	const colorSchemes = [
		{ bg: 'bg-blue-400', border: 'border-blue-400' },
		{ bg: 'bg-green-400', border: 'border-green-400' },
		{ bg: 'bg-purple-400', border: 'border-purple-400' },
		{ bg: 'bg-orange-400', border: 'border-orange-400' },
		{ bg: 'bg-pink-400', border: 'border-pink-400' }
	];

	function getSectionColor(sectionName: string, type: 'bg' | 'border' = 'bg') {
		const sectionIndex = typedSections.findIndex((s) => s.section_name === sectionName);
		const colorScheme = colorSchemes[sectionIndex % colorSchemes.length];

		if (!colorScheme) {
			return type === 'bg' ? 'bg-gray-400' : 'border-gray-400';
		}

		return type === 'bg' ? colorScheme.bg : colorScheme.border;
	}

	function formatTime(time: string) {
		return time.substring(0, 5); // Format HH:MM
	}

	const hours = Array.from({ length: 25 }, (_, i) => i);
</script>

<div class="self-center text-2xl">
	{new Date().toLocaleString('default', { month: 'long' })} 2025
</div>
<div class="self-center">
	<div class="self-center rounded-md bg-stone-100 p-3 shadow-md">
		<div class="grid grid-cols-7 gap-2">
			{#each weekDays as day}
				<div class="w-28 flex-1 pl-0.5">
					{day}
				</div>
			{/each}
			{#each days as dayInfo}
				<button
					class="relative flex h-20 w-28 cursor-pointer flex-col overflow-hidden rounded-xs bg-stone-200 text-left hover:bg-stone-300"
					class:bg-blue-50={dayInfo.hasReservations}
					class:border-blue-300={dayInfo.hasReservations}
					class:border={dayInfo.hasReservations}
					onclick={() => handleDayClick(dayInfo.date)}
					tabindex="0"
				>
					<div class="px-2 py-1 text-sm text-stone-600 italic">
						{dayInfo.date.getDate()}
					</div>

					<!-- Section indicators -->
					{#if dayInfo.hasReservations}
						<div class="absolute top-1 right-1 flex flex-col gap-0.5">
							{#each typedSections as section}
								{#if dayInfo.sectionCounts[section.section_name] > 0}
									<div
										class="h-1.5 w-1.5 rounded-full {getSectionColor(section.section_name, 'bg')
											.replace('bg-', 'bg-')
											.replace('-400', '-500')}"
										title="{section.section_name}: {dayInfo.sectionCounts[
											section.section_name
										]} rezerwacji"
									></div>
								{/if}
							{/each}
						</div>
					{/if}

					<div class="mt-auto flex flex-col gap-0.5 overflow-auto px-1">
						<!-- Show actual reservations from database -->
						{#if dayInfo.reservations && dayInfo.reservations.length > 0}
							{#each dayInfo.reservations.slice(0, 3) as reservation}
								<div
									class="{getSectionColor(
										reservation.section_name
									)} truncate rounded-xs px-1 text-xs text-white"
									title="{reservation.section_name}: {formatTime(
										reservation.start_time
									)}-{formatTime(
										reservation.end_time
									)} - {reservation.firstname} {reservation.surname}"
								>
									{reservation.section_name.split(' ')[1]}: {formatTime(reservation.start_time)}
								</div>
							{/each}
							{#if dayInfo.reservations.length > 3}
								<div class="rounded-xs bg-gray-400 px-1 text-xs text-white">
									+{dayInfo.reservations.length - 3} więcej
								</div>
							{/if}
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Legend for section colors -->
	<div class="self-center rounded-md bg-white p-3 shadow-sm">
		<h3 class="mb-2 text-sm font-semibold text-gray-700">Legenda sekcji:</h3>
		<div class="flex justify-center gap-4 text-sm">
			{#each typedSections as section, index}
				<div class="flex items-center gap-1">
					<div
						class="h-3 w-3 rounded-full {getSectionColor(section.section_name, 'bg')
							.replace('bg-', 'bg-')
							.replace('-400', '-500')}"
					></div>
					<span class="text-gray-700">{section.section_name} - {section.description}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="overflow-hidden p-6">
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-gray-700">Dzisiejsze rezerwacje - widok czasowy</h3>
			<p class="text-sm text-gray-500">Przegląd wszystkich rezerwacji na dzisiejszy dzień</p>
		</div>
		<div class="relative mt-6 flex h-40 flex-col gap-0.5">
			{#each hours as hour, i}
				<div
					class="absolute h-full w-full border-l border-stone-400"
					style="translate: calc({(i * 100) / 24}%)"
				>
					<div class="absolute bottom-full -translate-x-1/2">{hour}</div>
				</div>
			{/each}

			<!-- Display today's reservations on timeline -->
			{#each todayReservations as reservation, index}
				{@const startHour =
					parseFloat(reservation.start_time.split(':')[0]) +
					parseFloat(reservation.start_time.split(':')[1]) / 60}
				{@const endHour =
					parseFloat(reservation.end_time.split(':')[0]) +
					parseFloat(reservation.end_time.split(':')[1]) / 60}
				{@const duration = endHour - startHour}
				{@const width = (duration * 100) / 24}

				<div
					class="absolute z-10 h-6"
					style="left: calc({(startHour * 100) / 24}%); width: {width}%; top: {index * 28 + 10}px"
				>
					<div
						class="{getSectionColor(
							reservation.section_name
						)} mx-[0.5px] h-full rounded-sm border-l-2 shadow-sm {getSectionColor(
							reservation.section_name,
							'border'
						)} flex items-center px-2 text-xs font-medium text-white"
						title="{reservation.section_name}: {reservation.firstname} {reservation.surname}{reservation.project_name
							? ` - ${reservation.project_emoji || ''}${reservation.project_name}`
							: ''} - {reservation.notes || 'Brak notatek'}"
					>
						<span class="truncate">
							{reservation.section_name.split(' ')[1]} - {reservation.firstname}
							{reservation.surname}
							{#if reservation.project_emoji}
								<span class="ml-1">{reservation.project_emoji}</span>
							{/if}
							{#if reservation.notes}
								({reservation.notes})
							{/if}
						</span>
					</div>
				</div>
			{/each}

			{#if todayReservations.length === 0}
				<div class="absolute inset-0 flex items-center justify-center text-gray-500">
					<div class="text-center">
						<p class="text-lg">Brak rezerwacji na dziś</p>
						<p class="text-sm">Kliknij na dzień w kalendarzu, aby zobaczyć lub dodać rezerwacje</p>
					</div>
				</div>
			{/if}
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
<ReservationDialog
	bind:open={openReservationDialog}
	{selectedDate}
	reservations={selectedDateReservations}
	onReservationUpdated={handleReservationUpdated}
/>
