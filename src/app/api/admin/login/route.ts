import { NextResponse } from "next/server";
import { verifyAdminPassword, adminSessionValue, ADMIN_COOKIE } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(`admin-login:${getClientIp(request.headers)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.success) {
    return NextResponse.json({ message: "Too many attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || !verifyAdminPassword(password)) {
    return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, adminSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
