import { auth } from '$lib/auth.server';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
  const session = await auth(event);

  return {
    userData: session.userData,
  };
}) satisfies LayoutServerLoad;


