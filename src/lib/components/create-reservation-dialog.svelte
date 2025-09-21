<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { enhance } from '$app/forms';
	import type { Section, Project } from '$lib/db/index.js';
	import { onMount } from 'svelte';

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
	let startTime = $state('09:00');
	let endTime = $state('11:00');
	let selectedProjectId = $state<string>('1'); // Default to first project (Kraken)
	let notes = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Dynamic sections and projects from database
	let sections = $state<Section[]>([]);
	let projects = $state<Project[]>([]);
	let loading = $state(true);

	// Derived value for project trigger content
	const triggerContent = $derived.by(() => {
		const selectedProject = projects.find((p) => p.id.toString() === selectedProjectId);
		return selectedProject
			? `${selectedProject.emoji || ''} ${selectedProject.name}`.trim()
			: 'Wybierz projekt';
	});

	// Predefined colors that will be assigned to sections (same as in reservation dialog)
	const colorSchemes = [
		{
			color: 'bg-blue-500',
			textColor: 'text-blue-800',
			lightBg: 'bg-blue-50',
			border: 'border-blue-300'
		},
		{
			color: 'bg-green-500',
			textColor: 'text-green-800',
			lightBg: 'bg-green-50',
			border: 'border-green-300'
		},
		{
			color: 'bg-purple-500',
			textColor: 'text-purple-800',
			lightBg: 'bg-purple-50',
			border: 'border-purple-300'
		},
		{
			color: 'bg-orange-500',
			textColor: 'text-orange-800',
			lightBg: 'bg-orange-50',
			border: 'border-orange-300'
		}
	];

	// Fetch sections and projects from API
	async function fetchData() {
		try {
			loading = true;
			const [sectionsResponse, projectsResponse] = await Promise.all([
				fetch('/api/sections'),
				fetch('/api/projects')
			]);

			if (sectionsResponse.ok && projectsResponse.ok) {
				sections = await sectionsResponse.json();
				projects = await projectsResponse.json();

				// Set default project if not already set and we have projects
				if (projects.length > 0 && selectedProjectId === '1') {
					selectedProjectId = projects[0].id.toString();
				}
			} else {
				console.error('Failed to fetch data');
			}
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			loading = false;
		}
	}

	// Load data when component mounts
	onMount(() => {
		fetchData();
	});

	function getSectionInfo(sectionName: string | null) {
		if (!sectionName || sections.length === 0) return colorSchemes[0];

		const sectionIndex = sections.findIndex((s) => s.section_name === sectionName);
		return colorSchemes[sectionIndex % colorSchemes.length] || colorSchemes[0];
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
		if (!sectionName || sections.length === 0) return 1;

		const section = sections.find((s) => s.section_name === sectionName);
		return section ? section.id : 1;
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

		// Validate notes for "Inne" project
		const selectedProject = projects.find((p) => p.id.toString() === selectedProjectId);
		if (selectedProject?.name === 'Inne' && (!notes || notes.trim() === '')) {
			errorMessage = 'Dla projektu "Inne" wymagana jest notatka z opisem projektu';
			return;
		}

		isSubmitting = true;
		errorMessage = '';
		successMessage = '';

		try {
			const formData = new FormData();
			formData.append('section_id', getSectionId(selectedSection).toString());
			formData.append('project_id', selectedProjectId);
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
				selectedProjectId = '1';
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
			selectedProjectId = '1';
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
					{selectedSection}
					{#if selectedSection}
						{#each sections as section}
							{#if section.section_name === selectedSection}
								- {section.description}
							{/if}
						{/each}
					{/if}
				</h3>
				<p class="text-sm text-gray-600">Dostępna do rezerwacji • Praca zespołowa dozwolona</p>
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

			<!-- Project Selection -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700"> Projekt </label>
				{#if projects.length > 0}
					<Select.Root type="single" bind:value={selectedProjectId}>
						<Select.Trigger
							class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						>
							{triggerContent}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each projects as project (project.id)}
									<Select.Item value={project.id.toString()} label={project.name}>
										<div class="flex items-center gap-2">
											{#if project.emoji}
												<span>{project.emoji}</span>
											{/if}
											<span>{project.name}</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				{:else}
					<div class="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500">
						Ładowanie projektów...
					</div>
				{/if}
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
