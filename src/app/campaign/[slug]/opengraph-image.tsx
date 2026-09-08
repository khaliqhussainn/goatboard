import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getCampaign(slug: string): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

async function getRank(campaign: Campaign): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("campaigns")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .or(
      `total_power.gt.${campaign.total_power},and(total_power.eq.${campaign.total_power},updated_at.lt.${campaign.updated_at})`,
    );
  return (count ?? 0) + 1;
}

export default async function Image({ params }: { params: { slug: string } }) {
  const campaign = await getCampaign(params.slug);

  if (!campaign) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            color: "#fff",
            fontSize: 64,
            fontWeight: 900,
          }}
        >
          GOATBOARD
        </div>
      ),
      size,
    );
  }

  const rank = await getRank(campaign);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdfaf3",
          fontFamily: "sans-serif",
        }}
      >
        {campaign.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.image_url}
            width={160}
            height={160}
            alt=""
            style={{
              borderRadius: 24,
              objectFit: "cover",
              marginBottom: 28,
            }}
          />
        ) : null}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#8a8a8a",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          #{rank} on GOATBOARD
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: "#0a0a0a",
            marginTop: 20,
            display: "flex",
            textAlign: "center",
            maxWidth: 1000,
          }}
        >
          {campaign.name}
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: "#0a0a0a",
            marginTop: 32,
            display: "flex",
          }}
        >
          {campaign.total_power.toLocaleString("en-US")} Power
        </div>
      </div>
    ),
    size,
  );
}
