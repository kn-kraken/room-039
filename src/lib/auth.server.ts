import { redirect, type RequestEvent } from '@sveltejs/kit';
import * as crypto from 'crypto';
import { CONSUMER_KEY, CONSUMER_SECRET } from '$env/static/private';

const sessions: { [key: string]: Session } = {};

export async function auth(event: RequestEvent): Promise<LoggedIn> {
	return authInStage(event, 'logged-in');
}

export function setUserAcceptedTerms({ cookies }: RequestEvent) {
	const id = cookies.get('session_id')!;
	const session = sessions[id];
	if (session && session.kind === 'logged-in') {
		session.userData.hasAcceptedTerms = true;
	}
}

export async function authInStage<Stage extends 'logging-in' | 'logged-in'>(
	{ cookies, url }: RequestEvent,
	stage: Stage
): Promise<Session & { kind: Stage }> {
	const id = cookies.get('session_id');
	if (!id || sessions[id]?.kind !== stage) {
		const text = await oauthFetch(
			'POST',
			'https://apps.usos.pw.edu.pl/services/oauth/request_token',
			'',
			{
				oauth_callback: `${url.origin}/token?` + new URLSearchParams({ next: url.toString() })
			}
		).then((res) => res.text());

		const res = new Map(text.split('&').map((s) => s.split('=') as [string, string]));
		const tokenSecret = res.get('oauth_token_secret')!;

		const sessionId = crypto.randomUUID();
		sessions[sessionId] = { tokenSecret, kind: 'logging-in' };

		cookies.set('session_id', sessionId, {
			secure: true,
			httpOnly: true,
			path: '/'
		});

		throw redirect(
			302,
			`https://apps.usos.pw.edu.pl/services/oauth/authorize?oauth_token=${res.get('oauth_token')!}`
		);
	}

	return sessions[id] as Session & { kind: Stage };
}

export function setUserData({ cookies }: RequestEvent, userData: any) {
	const id = cookies.get('session_id')!;
	const hasAcceptedTerms = userData.hasAcceptedTerms ?? false;
	sessions[id]! = { kind: 'logged-in', userData: { ...userData, hasAcceptedTerms } };
}

function percentEscape(str: string) {
	return encodeURIComponent(str)
		.replace(/\!/g, '%21')
		.replace(/\*/g, '%2A')
		.replace(/\'/g, '%27')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29');
}

function pc(strings: TemplateStringsArray, ...values: string[]): string {
	let result = strings[0]!;
	for (let i = 0; i < values.length; i++) {
		result += percentEscape(values[i]!) + strings[i + 1]!;
	}
	return result;
}

function getAuthHeader(
	method: string,
	url: string,
	secret: string,
	oauthParams: Record<string, string>
): string {
	const entries = Object.entries(oauthParams);
	entries.sort((a, b) => a[0].localeCompare(b[0]));
	const encoded = entries.map(([key, value]) => `${key}=` + pc`${value}`).join('&');

	const baseString = pc`${method}&${url}&${encoded}`;

	let hmac = crypto.createHmac('sha1', pc`${CONSUMER_SECRET!}&${secret}`);

	hmac.update(baseString);
	const signature = percentEscape(hmac.digest('base64'));

	const params = entries.map(([key, value]) => pc`${key}="${value}"`).join(',');

	return `OAuth ${params},oauth_signature="${signature}"`;
}

export function oauthFetch(
	method: string,
	url: string,
	secret: string,
	params: Record<string, string>
) {
	const oauthParams = {
		oauth_consumer_key: CONSUMER_KEY,
		oauth_nonce: crypto.randomBytes(16).toString('base64'),
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: (Date.now() / 1000).toFixed(0),
		oauth_version: '1.0',
		...params
	};

	return fetch(url, {
		method,
		headers: {
			Authorization: getAuthHeader(method, url, secret, oauthParams)
		}
	});
}

type LoggingIn = {
	kind: 'logging-in';
	tokenSecret: string;
};

type LoggedIn = {
	kind: 'logged-in';
	userData: {
		id: number;
		name: string;
		hasAcceptedTerms: boolean;
	};
};

type Session = LoggingIn | LoggedIn;
