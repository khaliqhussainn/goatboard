import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SplashScreen } from "@/components/layout/splash-screen";
import { getSiteUrl } from "@/lib/utils";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
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
  url: "/og-image.jpg",
  width: 1200,
  height: 628,
  // JPEG, not PNG: the same card as a PNG is 503KB, and WhatsApp drops the
  // preview entirely somewhere above ~300KB. At q90 this is 135KB and the
  // difference is invisible at card size.
  type: "image/jpeg",
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
      className={`${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SplashScreen />
        <AnnouncementBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {modal}
        <Toaster position="bottom-center" richColors closeButton />
        {/* Last resort for the splash. Inline, so it runs even if the app
            bundle never loads - in which case hydration never happens and
            SplashReady would never clear it. Eight seconds is far past a
            normal hydration, so this only ever fires when something broke. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "setTimeout(function(){document.documentElement.classList.add('app-ready')},8000)",
          }}
        />
      </body>
    </html>
  );
}
