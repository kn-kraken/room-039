<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import CreateReservationDialog from './create-reservation-dialog.svelte';
	import type { ReservationWithDetails, Section } from '$lib/db/index.js';
	import { onMount } from 'svelte';

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

	// Dynamic sections from database
	let sections = $state<Section[]>([]);
	let loading = $state(true);

	// Predefined colors that will be assigned to sections
	const colorSchemes = [
		{
			color: 'bg-blue-500',
			lightBg: 'bg-blue-50',
			border: 'border-blue-300',
			textColor: 'text-blue-800',
			buttonColor: 'bg-blue-600 hover:bg-blue-700',
			supervisorColor: 'text-blue-700'
		},
		{
			color: 'bg-green-500',
			lightBg: 'bg-green-50',
			border: 'border-green-300',
			textColor: 'text-green-800',
			buttonColor: 'bg-green-600 hover:bg-green-700',
			supervisorColor: 'text-green-700'
		},
		{
			color: 'bg-purple-500',
			lightBg: 'bg-purple-50',
			border: 'border-purple-300',
			textColor: 'text-purple-800',
			buttonColor: 'bg-purple-600 hover:bg-purple-700',
			supervisorColor: 'text-purple-700'
		},
		{
			color: 'bg-orange-500',
			lightBg: 'bg-orange-50',
			border: 'border-orange-300',
			textColor: 'text-orange-800',
			buttonColor: 'bg-orange-600 hover:bg-orange-700',
			supervisorColor: 'text-orange-700'
		},
		{
			color: 'bg-pink-500',
			lightBg: 'bg-pink-50',
			border: 'border-pink-300',
			textColor: 'text-pink-800',
			buttonColor: 'bg-pink-600 hover:bg-pink-700',
			supervisorColor: 'text-pink-700'
		}
	];

	// Fetch sections from API
	async function fetchSections() {
		try {
			loading = true;
			const response = await fetch('/api/sections');
			if (response.ok) {
				sections = await response.json();
			} else {
				console.error('Failed to fetch sections');
			}
		} catch (error) {
			console.error('Error fetching sections:', error);
		} finally {
			loading = false;
		}
	}

	// Load sections when component mounts
	onMount(() => {
		fetchSections();
	});

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
		const sectionIndex = sections.findIndex((s) => s.section_name === sectionName);
		const colorScheme = colorSchemes[sectionIndex % colorSchemes.length];

		return (
			colorScheme || {
				color: 'bg-gray-500',
				lightBg: 'bg-gray-50',
				border: 'border-gray-300',
				textColor: 'text-gray-800',
				buttonColor: 'bg-gray-600 hover:bg-gray-700',
				supervisorColor: 'text-gray-700'
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
					{#if loading}
						<div class="flex flex-1 items-center justify-center">
							<div class="text-center">
								<div
									class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
								></div>
								<p class="text-gray-600">Ładowanie sekcji...</p>
							</div>
						</div>
					{:else if sections.length === 0}
						<div class="flex flex-1 items-center justify-center">
							<div class="text-center text-gray-500">
								<p class="text-lg">Brak dostępnych sekcji</p>
							</div>
						</div>
					{:else}
						{#each sections as section, index}
							{@const sectionInfo = getSectionInfo(section.section_name)}
							<div class="relative max-h-[50vh] min-w-0 flex-1">
								<div
									class="h-full rounded-xl border-3 {sectionInfo.border} {sectionInfo.lightBg} p-6 shadow-lg"
								>
									<div class="mb-4 text-center">
										<h3 class="text-2xl font-bold {sectionInfo.textColor}">
											{section.section_name}
										</h3>
										<p class="text-base {sectionInfo.textColor} mb-3 opacity-80">
											{section.description}
										</p>
										<button
											class="w-full rounded-lg {sectionInfo.buttonColor} px-4 py-2 text-sm font-medium text-white transition-colors"
											onclick={() => addReservation(section.section_name)}
										>
											+ Dodaj rezerwację
										</button>
									</div>

									<!-- Reservations for this section -->
									<div class="max-h-[65%] space-y-3 overflow-y-auto">
										{#if reservationsBySection[section.section_name]?.length > 0}
											{#each reservationsBySection[section.section_name] as reservation}
												<div
													class="border-l-4 {getStatusColor(
														reservation.status
													)} rounded-r-lg bg-white p-3 text-sm shadow-sm"
												>
													<div class="text-lg font-semibold">
														{formatTime(reservation.start_time)} - {formatTime(
															reservation.end_time
														)}
													</div>
													<div class="font-medium text-gray-700">
														{reservation.firstname}
														{reservation.surname}
													</div>
													{#if reservation.project_name}
														<div class="mt-1 flex items-center gap-1 text-sm text-gray-600">
															{#if reservation.project_emoji}
																<span>{reservation.project_emoji}</span>
															{/if}
															<span>{reservation.project_name}</span>
														</div>
													{/if}
													{#if reservation.notes}
														<div class="mt-2 text-sm text-gray-600 italic">
															"{reservation.notes}"
														</div>
													{/if}
													{#if reservation.supervisor_firstname}
														<div class="mt-2 text-sm {sectionInfo.supervisorColor}">
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

									<!-- Equipment indicators (keeping generic for now) -->
									<div class="absolute right-4 bottom-4 flex gap-2">
										<div
											class="h-4 w-4 rounded-full {sectionInfo.color} opacity-60 shadow"
											title="Wyposażenie 1"
										></div>
										<div
											class="h-4 w-4 rounded-full {sectionInfo.color} opacity-80 shadow"
											title="Wyposażenie 2"
										></div>
										<div
											class="h-4 w-4 rounded-full {sectionInfo.color} shadow"
											title="Wyposażenie 3"
										></div>
									</div>
								</div>
							</div>
						{/each}
					{/if}
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
				{#if !loading && sections.length > 0}
					{#each sections as section, index}
						{@const sectionInfo = getSectionInfo(section.section_name)}
						<div
							class="min-w-0 flex-1 overflow-auto rounded-xl border {sectionInfo.border.replace(
								'border-',
								'border-'
							)} {sectionInfo.lightBg} p-4 shadow-sm"
						>
							<h4 class="mb-2 text-lg font-bold {sectionInfo.textColor}">
								📋 {section.section_name}
							</h4>
							<div class="space-y-1 text-sm {sectionInfo.textColor}">
								{#if section.instructions}
									{#each section.instructions.split('\n') as instruction}
										{#if instruction.trim()}
											<p>{instruction}</p>
										{/if}
									{/each}
								{:else}
									<p>• {section.description}</p>
									<p>• Dostępna do rezerwacji</p>
									<p>• Idealna do pracy zespołowej</p>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
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
