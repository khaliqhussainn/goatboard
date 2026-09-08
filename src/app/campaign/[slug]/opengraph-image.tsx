import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getCampaignBySlug, getCampaignRank } from "@/lib/queries/campaign";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

let logoDataUrl: string | null | undefined;

// The campaign's tile image lives on an external host and may 404, time
// out, or stop resolving by the time X/Discord crawl this route — falling
// through to the GOATBOARD wordmark keeps the share card branded instead of
// broken. Cached so repeated OG requests don't re-read the file from disk.
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

// next/og's Satori-based renderer can only rasterize a handful of formats —
// .ico (and other oddities users might upload as a campaign avatar) report
// an image/* content-type but render as a blank box, which is worse than
// falling back to the logo.
const RENDERABLE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

async function getValidImageUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!RENDERABLE_IMAGE_TYPES.has(contentType)) return null;
    return url;
  } catch {
    return null;
  }
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
  const tileImage = await getValidImageUrl(campaign.image_url);

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
        {tileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tileImage}
            width={160}
            height={160}
            alt=""
            style={{
              borderRadius: 24,
              objectFit: "cover",
              marginBottom: 28,
            }}
          />
        ) : logo ? (
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
