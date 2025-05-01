import * as crypto from "crypto";
import homepage from "./index.html";
import login from "./login.html";
import user from "./user.html";

function percentEscape(str: string) {
    return encodeURIComponent(str)
        .replace(/\!/g, "%21")
        .replace(/\*/g, "%2A")
        .replace(/\'/g, "%27")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29");
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
    const encoded = entries
        .map(([key, value]) => `${key}=` + pc`${value}`)
        .join("&");

    const baseString = pc`${method}&${url}&${encoded}`;

    let hmac = crypto.createHmac(
        "sha1",
        pc`${Bun.env.CONSUMER_SECRET!}&${secret}`
    );

    hmac.update(baseString);
    const signature = percentEscape(hmac.digest("base64"));

    const params = entries
        .map(([key, value]) => pc`${key}="${value}"`)
        .join(",");

    return `OAuth ${params},oauth_signature="${signature}"`;
}

function oauthFetch(
    method: string,
    url: string,
    secret: string,
    params: Record<string, string>
) {
    const oauthParams = {
        oauth_consumer_key: Bun.env.CONSUMER_KEY as string,
        oauth_nonce: crypto.randomBytes(16).toString("base64"),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: (Date.now() / 1000).toFixed(0),
        oauth_version: "1.0",
        ...params,
    };

    return fetch(url, {
        method,
        headers: {
            Authorization: getAuthHeader(method, url, secret, oauthParams),
        },
    });
}

type Session = {
    token?: string;
    tokenSecret: string;
};

const sessions: { [key: string]: Session } = {};

function getSession(req: Bun.BunRequest): Session | null {
    const session = sessions[req.cookies.get("session_id")!];

    return session ?? null;
}

const server = Bun.serve({
    routes: {
        "/": homepage,
        "/login": {
            async GET(req) {
                const session = getSession(req);
                if (session) {
                    return Response.redirect("/");
                }

                const text = await oauthFetch(
                    "POST",
                    "https://apps.usos.pw.edu.pl/services/oauth/request_token",
                    "",
                    {
                        oauth_callback: "http://localhost:3000/token",
                    }
                ).then((res) => res.text());

                const res = new Map(
                    text.split("&").map((s) => s.split("=") as [string, string])
                );

                const tokenSecret = res.get("oauth_token_secret")!;
                const sessionId = crypto.randomUUID();
                sessions[sessionId] = { tokenSecret };

                req.cookies.set("session_id", sessionId, {
                    secure: true,
                    httpOnly: true,
                });

                return Response.redirect(
                    `https://apps.usos.pw.edu.pl/services/oauth/authorize?oauth_token=${res.get(
                        "oauth_token"
                    )!}`
                );
            },
        },
        "/token": {
            async GET(req) {
                console.log(req.url);
                const session = getSession(req);
                if (!session) {
                    return Response.redirect("/");
                }

                const params = new URL(req.url).searchParams;
                const oauth_token = params.get("oauth_token");
                const oauth_verifier = params.get("oauth_verifier");

                if (!oauth_token || !oauth_verifier) {
                    console.log(oauth_token, oauth_verifier);
                    return Response.redirect("/");
                }

                const text = await oauthFetch(
                    "POST",
                    "https://apps.usos.pw.edu.pl/services/oauth/access_token",
                    session.tokenSecret,
                    {
                        oauth_token: oauth_token!,
                        oauth_verifier: oauth_verifier!,
                    }
                ).then((res) => res.text());

                const res = new Map(
                    text.split("&").map((s) => s.split("=") as [string, string])
                );

                const text2 = await oauthFetch(
                    "GET",
                    "https://apps.usos.pw.edu.pl/services/users/user",
                    res.get("oauth_token_secret")!,
                    {
                        oauth_token: res.get("oauth_token")!,
                    }
                ).then((res) => res.text());

                console.log(text2);

                return Response.redirect("/");
            },
        },
    },
    development: true,
});

console.log(`Listening on ${server.url}`);
