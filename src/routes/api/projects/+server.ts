import { json } from '@sveltejs/kit';
import { queries } from '$lib/db/index.js';

export const GET = async () => {
	try {
		const projects = queries.getAllProjects.all();
		return json(projects);
	} catch (error) {
		console.error('Error fetching projects:', error);
		return json({ error: 'Failed to fetch projects' }, { status: 500 });
	}
};
