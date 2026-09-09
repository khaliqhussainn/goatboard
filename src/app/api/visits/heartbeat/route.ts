import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Upserts "this visitor is still here" every ~30s while a tab is open — see
 * record_visitor_heartbeat in schema.sql. Powers the "Live" count.
 */
export async function POST(request: Request) {
  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ success: false, message: "no_visitor_id" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const limited = rateLimit(`heartbeat:${visitorId}:${ip}`, { limit: 10, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ success: false, message: "rate_limited" }, { status: 429 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("record_visitor_heartbeat", { p_visitor_id: visitorId });

    if (error) {
      console.error("record_visitor_heartbeat failed", error);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }
    console.error("record_visitor_heartbeat crashed", error);
    return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
  }
}
