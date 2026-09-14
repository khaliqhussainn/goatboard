import { NextResponse } from "next/server";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getListedCampaignSchema } from "@/lib/validation";
import { getListedPackage } from "@/lib/get-listed";
import { getVisitorId } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Creates a Get Listed campaign as a draft. Nothing is charged here and the
 * campaign is inert until a webhook confirms payment.
 *
 * The client's package key is the only thing it gets a say in - the
 * submission target comes from the package config, never from the request
 * body, so neither can be inflated by editing the payload.
 */
export async function POST(request: Request) {
  const ownerId = await getVisitorId();
  if (!ownerId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const { success } = rateLimit(`get-listed-campaign:${ownerId}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { message: "You're submitting too fast. Try again later." },
      { status: 429 },
    );
  }

  const ipLimit = rateLimit(`get-listed-campaign-ip:${getClientIp(request.headers)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = getListedCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const pkg = getListedPackage(input.package_key);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("get_listed_campaigns")
      .insert({
        owner_id: ownerId,
        startup_name: input.startup_name,
        website_url: input.website_url,
        description: input.description,
        category: input.category,
        x_url: input.x_url || null,
        linkedin_url: input.linkedin_url || null,
        other_url: input.other_url || null,
        package_key: pkg.key,
        // From config, not from the request.
        submission_target: pkg.submissionTarget,
        status: "draft",
        terms_accepted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("get_listed campaign insert failed", error);
      return NextResponse.json(
        { message: "Couldn't save your campaign. Try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("get_listed campaign creation crashed", error);
    return NextResponse.json(
      { message: "Couldn't save your campaign. Try again." },
      { status: 500 },
    );
  }
}
