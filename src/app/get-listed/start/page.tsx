import type { Metadata } from "next";
import Link from "next/link";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { StartCampaignForm } from "@/components/get-listed/start-campaign-form";

export const metadata: Metadata = {
  title: "Start a Get Listed campaign",
  robots: { index: false, follow: false },
};

export default async function StartGetListedPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageParam } = await searchParams;

  return (
    <div className="on-backdrop mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />

      <header className="mb-8 flex flex-col items-start gap-2">
        <Link href="/get-listed" className="text-sm text-muted-foreground underline underline-offset-4">
          Back to Get Listed
        </Link>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Start a campaign</h1>
        <p className="text-sm text-muted-foreground">
          Tell us about your startup. You&apos;ll review everything before paying.
        </p>
      </header>

      <StartCampaignForm initialPackage={packageParam} />
    </div>
  );
}
