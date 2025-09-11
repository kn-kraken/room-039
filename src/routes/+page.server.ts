import { auth, setUserAcceptedTerms } from '$lib/auth.server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { queries } from '$lib/db';

export const load = (async (event) => {
	const session = await auth(event);
	console.log(session);
	return { userData: session.userData };
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
	}
} satisfies Actions;
