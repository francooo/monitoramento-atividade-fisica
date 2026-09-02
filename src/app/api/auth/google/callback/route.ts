import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { findOrCreateGoogleUser } from "@/db/queries";
import {
  OAUTH_STATE_COOKIE,
  callbackUrl,
  googleCredentials,
  identityFromCode,
} from "@/lib/google-oauth";
import { createSession } from "@/lib/session";

function sameState(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function backToSignIn(request: NextRequest, reason: string) {
  const response = NextResponse.redirect(
    new URL(`/entrar?erro=${reason}`, request.url),
  );
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

/**
 * Volta do consentimento do Google: confere o `state`, troca o código pela
 * identidade e abre a sessão do app. Falha sempre para /entrar com um motivo
 * curto na URL — a tela mostra uma mensagem, e nada do erro cru vaza.
 */
export async function GET(request: NextRequest) {
  const credentials = googleCredentials();
  if (!credentials) return backToSignIn(request, "google-indisponivel");

  const params = request.nextUrl.searchParams;

  // A pessoa pode ter cancelado no Google — isso não é falha, é desistência.
  if (params.get("error")) return backToSignIn(request, "google-cancelado");

  const code = params.get("code");
  const state = params.get("state");
  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !expected || !sameState(state, expected)) {
    return backToSignIn(request, "google-falhou");
  }

  let userId: string;
  try {
    const identity = await identityFromCode({
      code,
      redirectUri: callbackUrl(request.url),
      credentials,
    });
    userId = await findOrCreateGoogleUser({
      email: identity.email,
      name: identity.name,
    });
  } catch (error) {
    console.error("[dawn] login com Google falhou:", error);
    return backToSignIn(request, "google-falhou");
  }

  await createSession(userId);

  const response = NextResponse.redirect(new URL("/feed", request.url));
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
