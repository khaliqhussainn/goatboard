import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const clickSchema = z.object({ campaignId: z.string().uuid() });

/**
 * Tracks an outbound click on a campaign's destination link. Purely
 * informational — never touches Power or ranking — so unlike voting there's
 * no per-visitor identity or daily limit, just a generous per-IP rate limit
 * to keep it from being trivially scriptable.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limited = rateLimit(`click:${ip}`, { limit: 60, windowMs: 60 * 1000 });
  if (!limited.success) {
    return NextResponse.json({ success: false, message: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = clickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "invalid_input" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("record_click", {
      p_campaign_id: parsed.data.campaignId,
    });

    if (error) {
      console.error("record_click failed", error);
      return NextResponse.json(
        { success: false, message: "server_error", detail: error.message },
        { status: 500 },
      );
    }

    const result = data?.[0];
    if (!result?.success) {
      return NextResponse.json({ success: false, message: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, clickCount: result.new_click_count });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }
    console.error("click crashed", error);
    return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
  }
}
