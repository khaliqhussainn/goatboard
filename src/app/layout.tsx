import type { Metadata } from "next";
import { Geist, Geist_Mono, Kalam } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteUrl } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The casual marker-script used only for hand-drawn-style annotations (the
// ad slot's "Your product could be here" / "Rent this spot" callouts).
const kalam = Kalam({
  variable: "--font-kalam",
  weight: ["700"],
  subsets: ["latin"],
});

/**
 * The share card every page falls back to, served straight out of public/
 * rather than composed at request time. The relative path is resolved against
 * metadataBase into the absolute URL scrapers require.
 *
 * 1200x630 (1.91:1) because that is the ratio every platform's card is built
 * around - X in particular will not render a summary_large_image far outside
 * it, which is why the 2.69:1 source artwork (public/goatboard.png) could not
 * be used directly. The card keeps that artwork whole and extends its edge
 * colours into the bands instead of cropping it.
 *
 * Campaign pages override this with their own opengraph-image route.
 */
const SHARE_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 628,
  type: "image/png",
  alt: "GOATBOARD - get VOAT to become a GOAT. The billboard for startups.",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Goatboard",
    template: "%s · Goatboard",
  },
  description:
    "GOATBOARD is a public competitive billboard. Vote or boost anything - products, startups, ideas, memes - to the #1 spot. There's only one spotlight. Who's the GOAT?",
  openGraph: {
    title: "GoatBoard — Get VOAT to become a GOAT",
    description: "The billboard for startups.",
    siteName: "GoatBoard",
    type: "website",
    // Relative, so metadataBase resolves it to the production origin rather
    // than whichever host happened to render the page.
    url: "/",
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoatBoard — Get VOAT to become a GOAT",
    description: "The billboard for startups.",
    images: [SHARE_IMAGE],
  },
};

export default function RootLayout({
  children,
  modal,
}: LayoutProps<"/"> & { modal: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${kalam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {modal}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
