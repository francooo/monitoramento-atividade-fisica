import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

const PROTECTED = ["/feed", "/mapa", "/progresso", "/voce", "/nova-atividade"];
const AUTH_ONLY = ["/entrar", "/criar-conta", "/recuperar-senha"];

/**
 * Guarda barata: olha só a presença do cookie. A validação real da sessão
 * acontece no servidor, em `getCurrentUser` — o proxy roda antes do render e
 * não abre conexão com o banco.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icons|img|favicon.ico).*)"],
};
