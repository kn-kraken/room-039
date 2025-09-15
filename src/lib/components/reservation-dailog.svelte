<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import CreateReservationDialog from './create-reservation-dialog.svelte';
	import type { ReservationWithDetails } from '$lib/db/index.js';

	let {
		open = $bindable(false),
		selectedDate = null,
		reservations = [],
		onReservationUpdated = () => {}
	}: {
		open?: boolean;
		selectedDate?: Date | null;
		reservations?: ReservationWithDetails[];
		onReservationUpdated?: () => void;
	} = $props();

	// State for create reservation dialog
	let createReservationOpen = $state(false);
	let selectedSectionForReservation = $state<string | null>(null);

	// Define colors and details for different sections
	const sectionInfo = {
		'Section A': {
			color: 'bg-blue-500',
			lightBg: 'bg-blue-50',
			border: 'border-blue-300',
			textColor: 'text-blue-800',
			position: 'left',
			description: 'Sala Boks 1'
		},
		'Section B': {
			color: 'bg-green-500',
			lightBg: 'bg-green-50',
			border: 'border-green-300',
			textColor: 'text-green-800',
			position: 'center',
			description: 'Sala Boks 2'
		},
		'Section C': {
			color: 'bg-purple-500',
			lightBg: 'bg-purple-50',
			border: 'border-purple-300',
			textColor: 'text-purple-800',
			position: 'right',
			description: 'Sala na piętrze'
		}
	};

	function formatDate(date: Date | null) {
		if (!date) return '';
		return date.toLocaleDateString('pl-PL', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatTime(time: string) {
		return time.substring(0, 5); // Format HH:MM
	}

	function getSectionInfo(sectionName: string) {
		return (
			sectionInfo[sectionName as keyof typeof sectionInfo] || {
				color: 'bg-gray-500',
				lightBg: 'bg-gray-50',
				border: 'border-gray-300',
				textColor: 'text-gray-800',
				position: 'center',
				description: 'Nieznana sekcja'
			}
		);
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'confirmed':
				return 'border-green-400 bg-green-50';
			case 'pending':
				return 'border-yellow-400 bg-yellow-50';
			case 'cancelled':
				return 'border-red-400 bg-red-50';
			default:
				return 'border-gray-400 bg-gray-50';
		}
	}

	// Group reservations by section
	const reservationsBySection = $derived(
		reservations.reduce(
			(acc, reservation) => {
				const sectionName = reservation.section_name;
				if (!acc[sectionName]) {
					acc[sectionName] = [];
				}
				acc[sectionName].push(reservation);
				return acc;
			},
			{} as Record<string, ReservationWithDetails[]>
		)
	);

	// Handle adding new reservation
	function addReservation(sectionName: string) {
		selectedSectionForReservation = sectionName;
		createReservationOpen = true;
	}

	// Handle reservation created callback
	function handleReservationCreated() {
		// Refresh the reservations list
		onReservationUpdated();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="h-[95vh] max-h-[95vh] max-w-none min-w-[95vw] overflow-hidden p-4">
		<Dialog.Header class="pb-4">
			<Dialog.Title class="text-center text-3xl font-bold">
				Sala 039 - {formatDate(selectedDate)}
			</Dialog.Title>
			<Dialog.Description class="text-center text-lg text-gray-600/40">
				Zarezerwuj odpowiednią sekcje dla siebie i kolegów z roku !
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex h-full flex-col gap-4">
			<!-- Room Layout - Top-down view -->
			<div class="relative flex-1 rounded-lg border-2 border-gray-300 bg-gray-100 p-6">
				<!-- Room title and door -->
				<div
					class="absolute top-0 left-1/2 h-3 w-20 -translate-x-1/2 transform rounded-b bg-amber-600"
				></div>

				<!-- Section Areas -->
				<div class="mt-2 flex h-full gap-8">
					<!-- Section A - Left -->
					<div class="relative max-h-[50vh] min-w-0 flex-1">
						<div
							class="h-full rounded-xl border-3 {getSectionInfo('Section A')
								.border} {getSectionInfo('Section A').lightBg} p-6 shadow-lg"
						>
							<div class="mb-4 text-center">
								<h3 class="text-2xl font-bold {getSectionInfo('Section A').textColor}">
									Section A
								</h3>
								<p class="text-base {getSectionInfo('Section A').textColor} mb-3 opacity-80">
									{getSectionInfo('Section A').description}
								</p>
								<button
									class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
									onclick={() => addReservation('Section A')}
								>
									+ Dodaj rezerwację
								</button>
							</div>

							<!-- Reservations for Section A -->
							<div class="max-h-[65%] space-y-3 overflow-y-auto">
								{#if reservationsBySection['Section A']?.length > 0}
									{#each reservationsBySection['Section A'] as reservation}
										<div
											class="border-l-4 {getStatusColor(
												reservation.status
											)} rounded-r-lg bg-white p-3 text-sm shadow-sm"
										>
											<div class="text-lg font-semibold">
												{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
											</div>
											<div class="font-medium text-gray-700">
												{reservation.firstname}
												{reservation.surname}
											</div>
											{#if reservation.notes}
												<div class="mt-2 text-sm text-gray-600 italic">"{reservation.notes}"</div>
											{/if}
											{#if reservation.supervisor_firstname}
												<div class="mt-2 text-sm text-blue-700">
													👨‍🏫 {reservation.supervisor_firstname}
													{reservation.supervisor_surname}
												</div>
											{/if}
										</div>
									{/each}
								{:else}
									<div class="py-12 text-center text-gray-500">
										<div
											class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-xl border-3 border-dashed border-gray-300"
										>
											<span class="text-4xl">🧑‍💻📦</span>
										</div>
										<p class="text-lg font-medium">Brak rezerwacji</p>
										<p class="text-sm">Stanowisko dostępne</p>
									</div>
								{/if}
							</div>

							<!-- Equipment indicators -->
							<div class="absolute right-4 bottom-4 flex gap-2">
								<div class="h-4 w-4 rounded-full bg-blue-400 shadow" title="Oscyloskop"></div>
								<div class="h-4 w-4 rounded-full bg-blue-600 shadow" title="Generator"></div>
								<div class="h-4 w-4 rounded-full bg-blue-800 shadow" title="Multimetr"></div>
							</div>
						</div>
					</div>

					<!-- Section B - Center -->
					<div class="relative max-h-[50vh] min-w-0 flex-1">
						<div
							class="h-full rounded-xl border-3 {getSectionInfo('Section B')
								.border} {getSectionInfo('Section B').lightBg} p-6 shadow-lg"
						>
							<div class="mb-4 text-center">
								<h3 class="text-2xl font-bold {getSectionInfo('Section B').textColor}">
									Section B
								</h3>
								<p class="text-base {getSectionInfo('Section B').textColor} mb-3 opacity-80">
									{getSectionInfo('Section B').description}
								</p>
								<button
									class="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
									onclick={() => addReservation('Section B')}
								>
									+ Dodaj rezerwację
								</button>
							</div>

							<!-- Reservations for Section B -->
							<div class="max-h-[65%] space-y-3 overflow-y-auto">
								{#if reservationsBySection['Section B']?.length > 0}
									{#each reservationsBySection['Section B'] as reservation}
										<div
											class="border-l-4 {getStatusColor(
												reservation.status
											)} rounded-r-lg bg-white p-3 text-sm shadow-sm"
										>
											<div class="text-lg font-semibold">
												{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
											</div>
											<div class="font-medium text-gray-700">
												{reservation.firstname}
												{reservation.surname}
											</div>
											{#if reservation.notes}
												<div class="mt-2 text-sm text-gray-600 italic">"{reservation.notes}"</div>
											{/if}
											{#if reservation.supervisor_firstname}
												<div class="mt-2 text-sm text-green-700">
													👨‍🏫 {reservation.supervisor_firstname}
													{reservation.supervisor_surname}
												</div>
											{/if}
										</div>
									{/each}
								{:else}
									<div class="py-12 text-center text-gray-500">
										<div
											class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-xl border-3 border-dashed border-gray-300"
										>
											<span class="text-4xl">🧑‍💻📦</span>
										</div>
										<p class="text-lg font-medium">Brak rezerwacji</p>
										<p class="text-sm">Stanowisko dostępne</p>
									</div>
								{/if}
							</div>

							<!-- Equipment indicators -->
							<div class="absolute right-4 bottom-4 flex gap-2">
								<div class="h-4 w-4 rounded-full bg-green-400 shadow" title="Komputer"></div>
								<div class="h-4 w-4 rounded-full bg-green-600 shadow" title="IDE"></div>
								<div class="h-4 w-4 rounded-full bg-green-800 shadow" title="Symulator"></div>
							</div>
						</div>
					</div>

					<!-- Section C - Right -->
					<div class="relative max-h-[50vh] min-w-0 flex-1">
						<div
							class="h-full rounded-xl border-3 {getSectionInfo('Section C')
								.border} {getSectionInfo('Section C').lightBg} p-6 shadow-lg"
						>
							<div class="mb-4 text-center">
								<h3 class="text-2xl font-bold {getSectionInfo('Section C').textColor}">
									Section C
								</h3>
								<p class="text-base {getSectionInfo('Section C').textColor} mb-3 opacity-80">
									{getSectionInfo('Section C').description}
								</p>
								<button
									class="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
									onclick={() => addReservation('Section C')}
								>
									+ Dodaj rezerwację
								</button>
							</div>

							<!-- Reservations for Section C -->
							<div class="max-h-[65%] space-y-3 overflow-y-auto">
								{#if reservationsBySection['Section C']?.length > 0}
									{#each reservationsBySection['Section C'] as reservation}
										<div
											class="border-l-4 {getStatusColor(
												reservation.status
											)} rounded-r-lg bg-white p-3 text-sm shadow-sm"
										>
											<div class="text-lg font-semibold">
												{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
											</div>
											<div class="font-medium text-gray-700">
												{reservation.firstname}
												{reservation.surname}
											</div>
											{#if reservation.notes}
												<div class="mt-2 text-sm text-gray-600 italic">"{reservation.notes}"</div>
											{/if}
											{#if reservation.supervisor_firstname}
												<div class="mt-2 text-sm text-purple-700">
													👨‍🏫 {reservation.supervisor_firstname}
													{reservation.supervisor_surname}
												</div>
											{/if}
										</div>
									{/each}
								{:else}
									<div class="py-12 text-center text-gray-500">
										<div
											class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-xl border-3 border-dashed border-gray-300"
										>
											<span class="text-4xl">𓊍📺</span>
										</div>
										<p class="text-lg font-medium">Brak rezerwacji</p>
										<p class="text-sm">Stanowisko dostępne</p>
									</div>
								{/if}
							</div>

							<!-- Equipment indicators -->
							<div class="absolute right-4 bottom-4 flex gap-2">
								<div class="h-4 w-4 rounded-full bg-purple-400 shadow" title="Mikroskop"></div>
								<div
									class="h-4 w-4 rounded-full bg-purple-600 shadow"
									title="Stanowisko badawcze"
								></div>
								<div class="h-4 w-4 rounded-full bg-purple-800 shadow" title="Analizator"></div>
							</div>
						</div>
					</div>
				</div>

				<!-- Enhanced Legend -->
				<div class="absolute -top-28 left-4 rounded-lg border bg-white p-4 shadow-lg">
					<div class="mb-3 text-lg font-bold">Legenda:</div>
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 border-l-4 border-green-400 bg-green-50"></div>
							<span>Potwierdzone</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 border-l-4 border-yellow-400 bg-yellow-50"></div>
							<span>Oczekujące</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-4 w-4 border-l-4 border-red-400 bg-red-50"></div>
							<span>Anulowane</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Instructions rectangles at bottom -->
			<div class="flex h-28 gap-6">
				<div
					class="min-w-0 flex-1 overflow-auto rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm"
				>
					<h4 class="mb-2 text-lg font-bold text-blue-800">📋 Sekcja A</h4>
					<div class="space-y-1 text-sm text-blue-700">
						<p>• Pierwszy boks od lewej</p>
						<p>• Idealny do spotkań oraz pracy zespołowej w grupach 2-4</p>
						<p>• Pozwala w spokoju i ciszy prowadzić badania</p>
					</div>
				</div>
				<div
					class="min-w-0 flex-1 overflow-auto rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm"
				>
					<h4 class="mb-2 text-lg font-bold text-green-800">📋 Sekcja B</h4>
					<div class="space-y-1 text-sm text-green-700">
						<p>• Drugi boks od lewej</p>
						<p>• Idealny do spotkań oraz pracy zespołowej w grupach 2-4</p>
						<p>• Pozwala w spokoju i ciszy prowadzić badania</p>
					</div>
				</div>
				<div
					class="min-w-0 flex-1 overflow-auto rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm"
				>
					<h4 class="mb-2 text-lg font-bold text-purple-800">📋 Sekcja C</h4>
					<div class="space-y-1 text-sm text-purple-700">
						<p>• Umiejscowiony na parterze</p>
						<p>• Idealny na spotkania w większym gronie</p>
						<p>
							• Posiada dotykowy ekran pozwalający na wizualizację zagadnień i prowadzenie
							prezentacji
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- <Dialog.Footer class="flex items-center justify-between border-t border-gray-200 pt-6">
			<div class="flex items-center gap-4 text-sm text-gray-600">
				<span class="font-semibold">Łącznie rezerwacji: {reservations.length}</span>
				{#if selectedDate}
					<span class="rounded bg-gray-100 px-2 py-1 text-xs">
						{selectedDate.toLocaleDateString('pl-PL')}
					</span>
				{/if}
			</div>
			<div class="flex gap-3">
				<button
					type="button"
					class="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
					onclick={() => (open = false)}
				>
					Zamknij
				</button>
			</div>
		</Dialog.Footer> -->
	</Dialog.Content>
</Dialog.Root>

<!-- Create Reservation Dialog -->
<CreateReservationDialog
	bind:open={createReservationOpen}
	{selectedDate}
	selectedSection={selectedSectionForReservation}
	onReservationCreated={handleReservationCreated}
/>
