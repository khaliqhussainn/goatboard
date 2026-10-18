import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/admin-auth";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { campaignSchema } from "@/lib/validation";
import { getVisitorId } from "@/lib/visitor";
import { slugify } from "@/lib/utils";

/** Admin-only campaign creation: publishes immediately and never creates a payment order. */
export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const visitorId = await getVisitorId();
  if (!visitorId) {
    return NextResponse.json({ message: "Missing visitor id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    const base = slugify(parsed.data.name) || "campaign";

    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: campaign, error } = await admin
        .from("campaigns")
        .insert({
          slug,
          name: parsed.data.name,
          description: parsed.data.description,
          destination_url: parsed.data.destination_url,
          image_url: parsed.data.image_urls[0],
          image_urls: parsed.data.image_urls,
          pricing_model: parsed.data.pricing_model,
          maker_name: parsed.data.maker_name,
          x_handle: parsed.data.x_handle,
          category: parsed.data.category,
          created_by: visitorId,
          status: "active",
        })
        .select("id, slug")
        .single();

      if (!error && campaign) {
        const { error: contactError } = await admin.from("campaign_contacts").insert({
          campaign_id: campaign.id,
          email: parsed.data.email,
          maker_email: parsed.data.maker_email,
        });

        if (contactError) {
          console.error("admin campaign contact insert failed", contactError);
          await admin.from("campaigns").delete().eq("id", campaign.id);
          return NextResponse.json(
            { message: "Couldn't save the campaign contact details." },
            { status: 500 },
          );
        }

        const firstComment = parsed.data.first_comment?.trim();
        if (firstComment) {
          const { error: commentError } = await admin.from("campaign_comments").insert({
            campaign_id: campaign.id,
            author_id: visitorId,
            author_x_handle: parsed.data.x_handle,
            is_founder: true,
            body: firstComment,
          });
          if (commentError) console.error("admin first comment insert failed", commentError);
        }

        return NextResponse.json({ slug: campaign.slug }, { status: 201 });
      }

      if (error && error.code !== "23505") {
        console.error("admin campaign insert failed", error);
        return NextResponse.json(
          { message: `Couldn't publish the campaign: ${error.message}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { message: "Couldn't find a free slug. Try a different name." },
      { status: 409 },
    );
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    console.error("admin campaign creation crashed", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: `Couldn't publish the campaign: ${detail}` },
      { status: 500 },
    );
  }
}
