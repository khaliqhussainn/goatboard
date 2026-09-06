import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "GOATBOARD — Take the board.",
    template: "%s · GOATBOARD",
  },
  description:
    "GOATBOARD is a public competitive billboard. Vote or boost anything — products, startups, ideas, memes — to the #1 spot. There's only one spotlight. Who's the GOAT?",
  openGraph: {
    title: "GOATBOARD — Take the board.",
    description:
      "One #1 spotlight. Everyone's fighting for it. Vote for free or boost with Power to climb the leaderboard.",
    siteName: "GOATBOARD",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GOATBOARD — Take the board.",
    description: "One #1 spotlight. Everyone's fighting for it.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="py-6 text-center text-xs text-muted-foreground">
            GOATBOARD — there is one spot everyone wants.
          </footer>
          <Toaster position="bottom-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
