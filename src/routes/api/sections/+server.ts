import { json } from '@sveltejs/kit';
import { queries } from '$lib/db/index.js';

export const GET = async () => {
	try {
		const sections = queries.getAllSections.all();
		return json(sections);
	} catch (error) {
		console.error('Error fetching sections:', error);
		return json({ error: 'Failed to fetch sections' }, { status: 500 });
	}
};
