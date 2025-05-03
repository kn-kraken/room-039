import { auth } from '$lib/auth.server';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const session = await auth(event);
	console.log(session);
	return session.userData;
}) satisfies PageServerLoad;
