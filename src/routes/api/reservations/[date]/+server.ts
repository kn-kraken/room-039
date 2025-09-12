import { json } from '@sveltejs/kit';
import { queries } from '$lib/db';
import type { ReservationWithDetails } from '$lib/db';

export async function GET({ params }: { params: { date: string } }) {
	try {
		const { date } = params;

		if (!date) {
			return json({ error: 'Date parameter is required' }, { status: 400 });
		}

		// Validate date format (YYYY-MM-DD)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(date)) {
			return json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, { status: 400 });
		}

		const reservations = queries.getReservationsByDate.all(date) as ReservationWithDetails[];

		// Filter out cancelled reservations
		const activeReservations = reservations.filter((r) => r.status !== 'cancelled');

		return json({
			success: true,
			reservations: activeReservations,
			date
		});
	} catch (error) {
		console.error('Error fetching reservations:', error);
		return json(
			{
				error: 'Failed to fetch reservations'
			},
			{ status: 500 }
		);
	}
}
