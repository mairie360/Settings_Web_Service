import { NextRequest, NextResponse } from "next/server";

/** This is a frontend-local cookie operation; no API or BFF is contacted. */
export function POST(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return new NextResponse(null, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
  if (process.env.NODE_ENV === "production" && !cookieDomain) {
    return NextResponse.json({ error: { message: "La déconnexion est temporairement indisponible." } }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  response.cookies.set({
    name: "accessToken",
    value: "",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
  return response;
}
