import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.string().trim().min(2).max(60);

export async function GET(request: Request) {
  const query = querySchema.safeParse(new URL(request.url).searchParams.get("query") ?? "");
  if (!query.success) return NextResponse.json({ products: [] });

  try {
    const admin = createAdminClient();
    const escaped = query.data.replace(/[%_]/g, "");
    if (escaped.length < 2) return NextResponse.json({ products: [] });

    const { data, error } = await admin
      .from("campaigns")
      .select("id, name, slug, image_url")
      .eq("status", "active")
      .ilike("name", `%${escaped}%`)
      .order("total_power", { ascending: false })
      .limit(8);
    if (error) throw error;

    return NextResponse.json({
      products: (data ?? []).map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        imageUrl: campaign.image_url,
        href: `/campaign/${campaign.slug}`,
      })),
    });
  } catch (error) {
    console.error("rant product search failed", error);
    return NextResponse.json({ message: "Couldn't search products." }, { status: 500 });
  }
}
