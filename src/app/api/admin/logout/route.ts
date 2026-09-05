import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/admin/login", request.url));
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
