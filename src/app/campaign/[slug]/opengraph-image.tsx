import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getCampaignBySlug, getCampaignRank } from "@/lib/queries/campaign";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

let logoDataUrl: string | null | undefined;

// Every share card is branded with the GOATBOARD wordmark, never the
// campaign's own image — consistent, recognizable link previews across the
// whole site rather than a different logo per campaign. Cached so repeated
// OG requests don't re-read the file from disk.
async function getLogoDataUrl(): Promise<string | null> {
  if (logoDataUrl !== undefined) return logoDataUrl;
  try {
    const buffer = await readFile(path.join(process.cwd(), "public", "logo-gb.png"));
    logoDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    logoDataUrl = null;
  }
  return logoDataUrl;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  const logo = await getLogoDataUrl();

  if (!campaign) {
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
            background: "#0a0a0a",
            color: "#fff",
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} height={80} alt="" style={{ marginBottom: 24 }} />
          ) : (
            <div style={{ display: "flex", fontSize: 64, fontWeight: 900 }}>GOATBOARD</div>
          )}
          <div style={{ display: "flex", fontSize: 28, color: "#8a8a8a" }}>www.goatboard.lol</div>
        </div>
      ),
      size,
    );
  }

  const rank = await getCampaignRank(campaign);

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
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} height={72} alt="" style={{ marginBottom: 28 }} />
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
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#8a8a8a",
            marginTop: 28,
            display: "flex",
          }}
        >
          www.goatboard.lol
        </div>
      </div>
    ),
    size,
  );
}
