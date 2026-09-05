import type { Metadata } from "next";
import { CampaignCreationForm } from "@/components/campaign/campaign-creation-form";

export const metadata: Metadata = {
  title: "Create Campaign",
  description: "Put something on the GOATBOARD. Create a campaign and start collecting Power.",
};

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          I have something I want people to notice.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create it. Publish it. Start collecting votes and Power.
        </p>
      </div>
      <CampaignCreationForm />
    </div>
  );
}
