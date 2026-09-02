import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** O Google emite os dois valores; aceitar só um deixaria logins de fora. */
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

// O `jose` busca as chaves públicas uma vez e as revalida sozinho conforme o
// cache-control do Google, então isso não vira um round-trip por login.
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export const OAUTH_STATE_COOKIE = "dawn_oauth_state";
export const OAUTH_STATE_TTL_SECONDS = 600;

export type GoogleCredentials = { clientId: string; clientSecret: string };

/**
 * Devolve `null` quando as chaves não estão no ambiente. O app inteiro continua
 * de pé sem elas — só o login social fica indisponível, o que importa para
 * quem clona o repositório e não tem projeto no Google.
 */
export function googleCredentials(): GoogleCredentials | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** O Google compara isto caractere a caractere com a lista do console. */
export function callbackUrl(requestUrl: string): string {
  return new URL("/api/auth/google/callback", requestUrl).toString();
}

export function authorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  // Sem refresh token: a sessão daqui é a do banco, e o app nunca chama a API
  // do Google em nome de ninguém depois do login.
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export type GoogleIdentity = {
  googleId: string;
  email: string;
  name: string;
};

/**
 * Troca o código pelo `id_token` e confere a assinatura contra as chaves
 * públicas do Google, além do emissor e da audiência. O token chega por um
 * canal server-to-server, mas verificar é barato e fecha a porta para um
 * `id_token` de outro projeto ser aceito aqui.
 */
export async function identityFromCode(input: {
  code: string;
  redirectUri: string;
  credentials: GoogleCredentials;
}): Promise<GoogleIdentity> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.credentials.clientId,
      client_secret: input.credentials.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`troca de código recusada pelo Google (${response.status})`);
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) throw new Error("resposta do Google sem id_token");

  const { payload: claims } = await jwtVerify(payload.id_token, JWKS, {
    issuer: ISSUERS,
    audience: input.credentials.clientId,
  });

  const email = typeof claims.email === "string" ? claims.email : "";
  // `email_verified` falso significa que o Google não confirmou a posse do
  // endereço — aceitar isso permitiria entrar na conta de outra pessoa só
  // declarando o e-mail dela.
  if (!email || claims.email_verified !== true) {
    throw new Error("conta do Google sem e-mail verificado");
  }

  return {
    googleId: String(claims.sub),
    email,
    name: typeof claims.name === "string" && claims.name.trim() ? claims.name : email,
  };
}
