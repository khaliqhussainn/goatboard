import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { campaignSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to publish a campaign." }, { status: 401 });
  }

  const { success } = rateLimit(`create-campaign:${user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { message: "You're creating campaigns too fast. Try again later." },
      { status: 429 },
    );
  }

  const ipLimit = rateLimit(`create-campaign-ip:${getClientIp(request.headers)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.success) {
    return NextResponse.json({ message: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const base = slugify(parsed.data.name) || "campaign";

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        slug,
        name: parsed.data.name,
        description: parsed.data.description,
        destination_url: parsed.data.destination_url,
        image_url: parsed.data.image_url || null,
        category: parsed.data.category,
        created_by: user.id,
      })
      .select("slug")
      .single();

    if (!error && data) {
      return NextResponse.json({ slug: data.slug }, { status: 201 });
    }

    if (error && error.code !== "23505") {
      return NextResponse.json({ message: "Couldn't publish your campaign." }, { status: 500 });
    }
  }

  return NextResponse.json(
    { message: "Couldn't find a free slug. Try a different name." },
    { status: 409 },
  );
}
