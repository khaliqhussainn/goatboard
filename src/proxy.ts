import { NextResponse, type NextRequest } from "next/server";
import {
  VISITOR_COOKIE,
  signVisitorId,
  verifyVisitorToken,
  VisitorTokenConfigError,
} from "@/lib/visitor";

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
 *
 * Re-mints the cookie whenever the existing one fails verification, not just
 * when it's missing entirely — anyone still carrying a pre-signing plain
 * UUID (or a token signed under an old/rotated secret) would otherwise be
 * stuck forever: the site would see "a cookie is present" and never replace
 * it, while every route that verifies it keeps rejecting it. This is what
 * makes that self-heal automatically instead of requiring everyone to clear
 * their cookies by hand.
 */
export function proxy(request: NextRequest) {
  const existingToken = request.cookies.get(VISITOR_COOKIE)?.value;

  let visitorId: string;
  try {
    // verifyVisitorToken needs VISITOR_TOKEN_SECRET too, and throws the
    // same VisitorTokenConfigError signVisitorId below can throw - only
    // reached when there's an existing cookie to check.
    if (existingToken && verifyVisitorToken(existingToken)) {
      return NextResponse.next();
    }
    visitorId = crypto.randomUUID();
  } catch (error) {
    if (error instanceof VisitorTokenConfigError) {
      console.error(error.message);
      return NextResponse.next();
    }
    throw error;
  }

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
