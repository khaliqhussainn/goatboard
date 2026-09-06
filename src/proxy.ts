import { NextResponse, type NextRequest } from "next/server";
import { VISITOR_COOKIE } from "@/lib/visitor";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * No Supabase Auth in this product. Every visitor instead gets a random,
 * anonymous id in a long-lived cookie — that's the only identity behind
 * daily vote limiting and "my campaigns" ownership. Assigning it here
 * (rather than lazily in each route) guarantees Server Components and
 * Route Handlers always see it on the very first request, by mutating the
 * request's cookies before calling NextResponse.next().
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(VISITOR_COOKIE)) {
    return NextResponse.next();
  }

  const visitorId = crypto.randomUUID();
  request.cookies.set(VISITOR_COOKIE, visitorId);

  const response = NextResponse.next({ request });
  response.cookies.set(VISITOR_COOKIE, visitorId, {
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
