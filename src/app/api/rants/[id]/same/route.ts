import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";

const idSchema = z.string().uuid();

export async function POST(request: Request, context: RouteContext<"/api/rants/[id]/same">) {
  const visitorId = await getVisitorId();
  if (!visitorId) return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });

  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ message: "Invalid rant." }, { status: 400 });

  const visitorLimit = rateLimit(`rant-same:${visitorId}`, { limit: 60, windowMs: 10 * 60 * 1000 });
  const ipLimit = rateLimit(`rant-same-ip:${getClientIp(request.headers)}`, { limit: 180, windowMs: 10 * 60 * 1000 });
  if (!visitorLimit.success || !ipLimit.success) {
    return NextResponse.json({ message: "Too many reactions. Try again shortly." }, { status: 429 });
  }

  try {
    const admin = createAdminClient();
    const { data: rant } = await admin.from("rants").select("id").eq("id", id).maybeSingle();
    if (!rant) return NextResponse.json({ message: "Rant not found." }, { status: 404 });

    const { data: existing } = await admin
      .from("rant_same_reactions")
      .select("rant_id")
      .eq("rant_id", id)
      .eq("visitor_id", visitorId)
      .maybeSingle();

    if (existing) {
      const { error } = await admin
        .from("rant_same_reactions")
        .delete()
        .eq("rant_id", id)
        .eq("visitor_id", visitorId);
      if (error) throw error;
    } else {
      const { error } = await admin
        .from("rant_same_reactions")
        .insert({ rant_id: id, visitor_id: visitorId });
      if (error) throw error;
    }

    const { data: updated, error: updatedError } = await admin
      .from("rants")
      .select("same_count")
      .eq("id", id)
      .single();
    if (updatedError || !updated) throw updatedError;

    return NextResponse.json({ didSame: !existing, sameCount: updated.same_count });
  } catch (error) {
    console.error("rant SAME reaction failed", error);
    return NextResponse.json({ message: "Couldn't update your reaction." }, { status: 500 });
  }
}
