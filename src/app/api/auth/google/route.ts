import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
  authorizationUrl,
  callbackUrl,
  googleCredentials,
} from "@/lib/google-oauth";

/**
 * Início do login com Google. Guarda um `state` aleatório em cookie e manda a
 * pessoa para o consentimento; o callback só aceita a volta se o `state` bater,
 * que é o que impede alguém de forjar o retorno do Google.
 */
export async function GET(request: Request) {
  const credentials = googleCredentials();
  if (!credentials) {
    return NextResponse.redirect(
      new URL("/entrar?erro=google-indisponivel", request.url),
    );
  }

  const state = randomBytes(32).toString("base64url");

  const response = NextResponse.redirect(
    authorizationUrl({
      clientId: credentials.clientId,
      redirectUri: callbackUrl(request.url),
      state,
    }),
  );

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // `lax` para o cookie sobreviver ao retorno vindo do domínio do Google.
    sameSite: "lax",
    path: "/",
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });

  return response;
}
