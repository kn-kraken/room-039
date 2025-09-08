import { auth, setUserAcceptedTerms } from '$lib/auth.server';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load = (async (event) => {
	const session = await auth(event);
	console.log(session);
	return { userData: session.userData };
}) satisfies PageServerLoad;

export const actions = {
	acceptTerms: async (event) => {
		try {
			setUserAcceptedTerms(event);
			return { success: true };
		} catch (error) {
			return fail(400, { error: 'Failed to accept terms' });
		}
	}
} satisfies Actions;
