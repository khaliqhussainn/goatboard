import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Shared by app/opengraph-image.tsx and app/twitter-image.tsx so every page
 * (nothing overrides it with a more specific opengraph-image/twitter-image
 * of its own) shows the GOATBOARD logo when its link is shared anywhere.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_ALT = "GOATBOARD";

const logoData = await readFile(join(process.cwd(), "public", "logo-gb.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

export async function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={800} height={268} alt="" />
      </div>
    ),
    { ...OG_IMAGE_SIZE },
  );
}
