import { auth, authInStage, oauthFetch, setUserData } from '$lib/auth.server';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET = (async (event) => {
	const session = await authInStage(event, 'logging-in');

	const oauthToken = event.url.searchParams.get('oauth_token');
	const oauthVerifier = event.url.searchParams.get('oauth_verifier');
	const nextUrl = event.url.searchParams.get('next');

	if (!oauthToken || !oauthVerifier || !nextUrl) {
		console.log(oauthToken, oauthVerifier);
		throw redirect(302, '/');
	}

	const text = await oauthFetch(
		'POST',
		'https://apps.usos.pw.edu.pl/services/oauth/access_token',
		session.tokenSecret,
		{
			oauth_token: oauthToken!,
			oauth_verifier: oauthVerifier!
		}
	).then((res) => res.text());

	const res = new Map(text.split('&').map((s) => s.split('=') as [string, string]));
	console.log('getting data from usos');
	const userData = await oauthFetch(
		'GET',
		'https://apps.usos.pw.edu.pl/services/users/user',
		res.get('oauth_token_secret')!,
		{
			oauth_token: res.get('oauth_token')!
		}
	).then((res) => res.json());

	setUserData(event, {
		id: userData.id,
		name: userData.first_name + ' ' + userData.last_name
	});

	throw redirect(302, nextUrl);
}) satisfies RequestHandler;
