<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { enhance } from '$app/forms';
	import type { Section } from '$lib/db/index.js';

	let {
		open = $bindable(false),
		selectedDate = null,
		selectedSection = null,
		onReservationCreated = () => {}
	}: {
		open?: boolean;
		selectedDate?: Date | null;
		selectedSection?: string | null;
		onReservationCreated?: () => void;
	} = $props();

	// Form state
	let startTime = '09:00';
	let endTime = '11:00';
	let notes = '';
	let isSubmitting = false;
	let errorMessage = '';
	let successMessage = '';

	// Section information
	const sectionInfo = {
		'Section A': {
			color: 'bg-blue-500',
			textColor: 'text-blue-800',
			description: 'Sekcja boks 1',
			requirements: 'Samodzielna praca dozwolona'
		},
		'Section B': {
			color: 'bg-green-500',
			textColor: 'text-green-800',
			description: 'Sekcja boks 2',
			requirements: 'Samodzielna praca dozwolona'
		},
		'Section C': {
			color: 'bg-purple-500',
			textColor: 'text-purple-800',
			description: 'Sekcja na piętrze',
			requirements: 'Samodzielna praca dozwolona'
		}
	};

	function getSectionInfo(sectionName: string | null) {
		if (!sectionName) return sectionInfo['Section A'];
		return sectionInfo[sectionName as keyof typeof sectionInfo] || sectionInfo['Section A'];
	}

	function formatDate(date: Date | null) {
		if (!date) return '';
		return date.toLocaleDateString('pl-PL', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateForInput(date: Date | null) {
		if (!date) return '';
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getSectionId(sectionName: string | null) {
		switch (sectionName) {
			case 'Section A':
				return 1;
			case 'Section B':
				return 2;
			case 'Section C':
				return 3;
			default:
				return 1;
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!selectedDate || !selectedSection) {
			errorMessage = 'Brak wybranej daty lub sekcji';
			return;
		}

		// Validate times
		if (startTime >= endTime) {
			errorMessage = 'Czas rozpoczęcia musi być wcześniejszy niż czas zakończenia';
			return;
		}

		isSubmitting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const formData = new FormData();
			formData.append('section_id', getSectionId(selectedSection).toString());
			formData.append('date', formatDateForInput(selectedDate));
			formData.append('start_time', startTime);
			formData.append('end_time', endTime);
			formData.append('notes', notes);

			const response = await fetch('?/createReservation', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success') {
				successMessage = 'Rezerwacja została utworzona pomyślnie!';
				// Reset form
				startTime = '09:00';
				endTime = '11:00';
				notes = '';
				// Close dialog after a short delay
				setTimeout(() => {
					open = false;
					onReservationCreated();
				}, 1500);
			} else {
				errorMessage = result.data?.error || 'Wystąpił błąd podczas tworzenia rezerwacji';
			}
		} catch (error) {
			console.error('Error creating reservation:', error);
			errorMessage = 'Wystąpił błąd podczas tworzenia rezerwacji';
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		if (!isSubmitting) {
			open = false;
			// Reset form
			startTime = '09:00';
			endTime = '11:00';
			notes = '';
			errorMessage = '';
			successMessage = '';
		}
	}

	// Generate time options (8:00 to 20:00 in 30-minute intervals)
	function generateTimeOptions() {
		const times = [];
		for (let hour = 8; hour < 20; hour++) {
			times.push(`${hour.toString().padStart(2, '0')}:00`);
			times.push(`${hour.toString().padStart(2, '0')}:30`);
		}
		times.push('20:00');
		return times;
	}

	const timeOptions = generateTimeOptions();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[85vh] w-[90vw] max-w-2xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-3 text-2xl font-bold">
				<div class="h-4 w-4 rounded-full {getSectionInfo(selectedSection).color}"></div>
				Nowa rezerwacja - {selectedSection}
			</Dialog.Title>
			<Dialog.Description class="text-lg text-gray-600">
				Tworzenie rezerwacji na dzień {formatDate(selectedDate)}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Section Info -->
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<h3 class="font-semibold {getSectionInfo(selectedSection).textColor} mb-2 text-lg">
					{selectedSection} - {getSectionInfo(selectedSection).description}
				</h3>
				<p class="text-sm text-gray-600">
					{getSectionInfo(selectedSection).requirements}
				</p>
			</div>

			<!-- Date and Time Selection -->
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Data rezerwacji </label>
					<input
						type="date"
						value={formatDateForInput(selectedDate)}
						class="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						readonly
					/>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Godzina rozpoczęcia </label>
					<select
						bind:value={startTime}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						required
					>
						{#each timeOptions as time}
							<option value={time}>{time}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> Godzina zakończenia </label>
					<select
						bind:value={endTime}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						required
					>
						{#each timeOptions as time}
							<option value={time}>{time}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Notes -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700"> Notatki (opcjonalne) </label>
				<textarea
					bind:value={notes}
					placeholder="Opisz cel rezerwacji, rodzaj wykonywanej pracy..."
					class="h-24 w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				></textarea>
			</div>

			<!-- Error/Success Messages -->
			{#if errorMessage}
				<div class="rounded-md border border-red-200 bg-red-50 p-4">
					<div class="flex items-center">
						<div class="text-sm text-red-800">
							<strong>Błąd:</strong>
							{errorMessage}
						</div>
					</div>
				</div>
			{/if}

			{#if successMessage}
				<div class="rounded-md border border-green-200 bg-green-50 p-4">
					<div class="flex items-center">
						<div class="text-sm text-green-800">
							<strong>Sukces:</strong>
							{successMessage}
						</div>
					</div>
				</div>
			{/if}

			<!-- Form Actions -->
			<div class="flex justify-end gap-3 border-t border-gray-200 pt-4">
				<button
					type="button"
					onclick={handleClose}
					disabled={isSubmitting}
					class="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					Anuluj
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isSubmitting}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
						></div>
						Tworzenie...
					{:else}
						Utwórz rezerwację
					{/if}
				</button>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
