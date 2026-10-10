import { NextRequest, NextResponse } from "next/server";
import { readFrontUrlsFromEnv } from "./lib/front-urls";
import { validatedFrontHref } from "./lib/navigation";
import {
  buildContentSecurityPolicy,
  createNonce,
  NONCE_REQUEST_HEADER,
} from "./lib/content-security-policy";

const ACCESS_TOKEN_COOKIE = "accessToken";

// This is only an early presence/expiry UX check. The BFF remains responsible
// for token authenticity and permissions; an opaque token or a missing expiry is refused before document rendering.
function isExpiredJwt(token: string) {
  const segments = token.split(".");
  if (segments.length !== 3 || segments.some(segment => !segment)) return true;
  try {
    const payload = JSON.parse(atob(segments[1].replace(/-/g, "+").replace(/_/g, "/")
      .padEnd(Math.ceil(segments[1].length / 4) * 4, "="))) as { exp?: unknown };
    return typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

function refuseSession(request: NextRequest) {
  const loginHref = validatedFrontHref(readFrontUrlsFromEnv().LOGIN_FRONT_URL);
  const publicHref = validatedFrontHref(readFrontUrlsFromEnv().SETTINGS_FRONT_URL);
  const destination = loginHref ? new URL(loginHref) : undefined;
  if (destination && publicHref) {
    const requested = new URL(publicHref);
    requested.pathname = request.nextUrl.pathname;
    requested.search = request.nextUrl.search;
    destination.searchParams.set('redirect', requested.href);
    destination.searchParams.set('resumeSession', '1');
  }
  const response = destination ? NextResponse.redirect(destination,
    ['GET', 'HEAD'].includes(request.method) ? 307 : 303) : new NextResponse(
    'Connexion temporairement indisponible. Veuillez contacter votre administrateur.',
    { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

// Après la garde de session, le middleware pose une CSP avec un nonce par
// requête. Next.js lit la CSP de la requête pour poser le nonce sur ses propres
// scripts : les pages doivent donc être rendues à la demande (voir src/app/layout.tsx).
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken || isExpiredJwt(accessToken)) return refuseSession(request);

  const nonce = createNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_REQUEST_HEADER, nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)", "/openapi.json", "/swagger.json"],
};
