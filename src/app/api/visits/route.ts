import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/** Records one "the site was opened" event — see record_site_visit in schema.sql. */
export async function POST(request: Request) {
  const visitorId = await getVisitorId();

  const ip = getClientIp(request.headers);
  const limited = rateLimit(`visit:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ success: false, message: "rate_limited" }, { status: 429 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("record_site_visit", { p_visitor_id: visitorId });

    if (error) {
      console.error("record_site_visit failed", error);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }
    console.error("record_site_visit crashed", error);
    return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
  }
}
