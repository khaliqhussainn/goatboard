import { NextResponse, type NextRequest } from "next/server";
import { VISITOR_COOKIE, signVisitorId, VisitorTokenConfigError } from "@/lib/visitor";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * No Supabase Auth in this product. Every visitor instead gets a random,
 * anonymous id, signed with a server-side secret and stored in a long-lived
 * cookie as `<uuid>.<hmac>` — that's the only identity behind daily vote
 * limiting and "my campaigns" ownership. Assigning it here (rather than
 * lazily in each route) guarantees Server Components and Route Handlers
 * always see it on the very first request, by mutating the request's
 * cookies before calling NextResponse.next().
 *
 * The signature stops a cookie value from being forged or edited client-side
 * (lib/visitor.ts's getVisitorId rejects anything that doesn't verify). It
 * does not, on its own, stop a client from discarding the cookie entirely
 * and getting a fresh signed identity on the next request — that's an
 * inherent property of a login-free system minting identities on demand, so
 * /api/votes also rate-limits by IP rather than relying on identity alone.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(VISITOR_COOKIE)) {
    return NextResponse.next();
  }

  const visitorId = crypto.randomUUID();

  let token: string;
  try {
    token = signVisitorId(visitorId);
  } catch (error) {
    // VISITOR_TOKEN_SECRET missing: don't hand out an identity nothing can
    // later verify. The request proceeds without a cookie; routes that need
    // one (e.g. /api/votes) will see no verified visitor id and fail closed.
    if (error instanceof VisitorTokenConfigError) {
      console.error(error.message);
      return NextResponse.next();
    }
    throw error;
  }

  request.cookies.set(VISITOR_COOKIE, token);

  const response = NextResponse.next({ request });
  response.cookies.set(VISITOR_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR * 2,
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
