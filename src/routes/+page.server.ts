import { auth, setUserAcceptedTerms } from '$lib/auth.server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { queries, dbHelpers } from '$lib/db';
import type { ReservationWithDetails } from '$lib/db';

export const load = (async (event) => {
	const session = await auth(event);
	console.log(session);

	// Get current month's date range
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	// Get all reservations for the current month
	const monthlyReservations: Record<string, ReservationWithDetails[]> = {};

	for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
		const dateString = date.toISOString().split('T')[0];
		const dayReservations = queries.getReservationsByDate.all(
			dateString
		) as ReservationWithDetails[];
		const activeReservations = dayReservations.filter((r) => r.status !== 'cancelled');

		if (activeReservations.length > 0) {
			monthlyReservations[dateString] = activeReservations;
		}
	}

	// Get today's reservations for preview
	const today = new Date().toISOString().split('T')[0];
	console.log(monthlyReservations);
	const todayReservations = monthlyReservations[today] || [];

	return {
		userData: session.userData,
		todayReservations,
		monthlyReservations
	};
}) satisfies PageServerLoad;

export const actions = {
	acceptTerms: async (event) => {
		try {
			const formData = await event.request.formData();
			setUserAcceptedTerms(event);
			queries.acceptTerms.run(formData.get('id') as string);
			return { success: true };
		} catch (error) {
			return fail(400, { error: 'Failed to accept terms' });
		}
	},

	getReservationsByDate: async (event) => {
		try {
			const formData = await event.request.formData();
			const date = formData.get('date') as string;

			if (!date) {
				return fail(400, { error: 'Date is required' });
			}

			const reservations = queries.getReservationsByDate.all(date) as ReservationWithDetails[];

			// Return success with data
			return {
				success: true,
				reservations: reservations.filter((r) => r.status !== 'cancelled')
			};
		} catch (error) {
			console.error('Error fetching reservations:', error);
			return fail(500, { error: 'Failed to fetch reservations' });
		}
	},

	createReservation: async (event) => {
		try {
			const session = await auth(event);
			const formData = await event.request.formData();

			const sectionId = parseInt(formData.get('section_id') as string);
			const date = formData.get('date') as string;
			const startTime = formData.get('start_time') as string;
			const endTime = formData.get('end_time') as string;
			const notes = (formData.get('notes') as string) || '';

			// Validate required fields
			if (!sectionId || !date || !startTime || !endTime) {
				return fail(400, { error: 'Wszystkie pola są wymagane' });
			}

			// Validate time range
			if (startTime >= endTime) {
				return fail(400, { error: 'Czas rozpoczęcia musi być wcześniejszy niż czas zakończenia' });
			}

			// Use the database helper to create reservation
			const result = dbHelpers.makeReservation(
				session.userData.id,
				sectionId,
				date,
				startTime,
				endTime,
				notes
			);

			console.log('Reservation created:', result);

			return {
				success: true,
				reservation: result
			};
		} catch (error) {
			console.error('Error creating reservation:', error);

			// Handle specific database errors
			if (error instanceof Error) {
				if (error.message.includes('already booked')) {
					return fail(400, { error: 'Ta sekcja jest już zarezerwowana w wybranym czasie' });
				}
				if (error.message.includes('only allowed between')) {
					return fail(400, { error: 'Rezerwacje są możliwe tylko między 8:00 a 20:00' });
				}
				if (error.message.includes('before end time')) {
					return fail(400, {
						error: 'Czas rozpoczęcia musi być wcześniejszy niż czas zakończenia'
					});
				}
				return fail(400, { error: error.message });
			}

			return fail(500, { error: 'Wystąpił błąd podczas tworzenia rezerwacji' });
		}
	}
} satisfies Actions;
