import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVisitorId } from "@/lib/visitor";
import { AbstractBackdrop } from "@/components/layout/abstract-backdrop";
import { CampaignAvatar } from "@/components/campaign/campaign-avatar";
import { GoatBadge } from "@/components/billboard/goat-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryAccent, categoryLabel } from "@/lib/categories";
import { formatPower } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Campaigns",
  description: "Every campaign you've put on GOATBOARD.",
  robots: { index: false, follow: false },
};

const STATUS_VARIANT = {
  active: "green",
  suspended: "yellow",
  removed: "pink",
} as const;

export default async function MinePage() {
  const visitorId = await getVisitorId();
  const admin = createAdminClient();

  const { data: campaigns } = visitorId
    ? await admin
        .from("campaigns")
        .select("*")
        .eq("created_by", visitorId)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AbstractBackdrop />
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">My Campaigns</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every startup, product, or idea you&apos;ve put on the board - no account required,
            this browser is your key.
          </p>
        </div>
        <Link href="/create" className="shrink-0">
          <Button variant="abstract">New campaign</Button>
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="billboard-surface-lg flex flex-col items-center gap-4 rounded-[2rem] py-20 text-center">
          <p className="text-xl font-black tracking-tight">Nothing here yet.</p>
          <p className="text-sm text-muted-foreground">
            Campaigns you create in this browser will show up here.
          </p>
          <Link href="/create">
            <Button size="lg" variant="abstract">
              Create Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaign/${c.slug}`}
              className="billboard-surface-sm flex items-center gap-4 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
            >
              <CampaignAvatar src={c.image_url} name={c.name} className="size-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold">{c.name}</p>
                  <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  <Badge variant={categoryAccent(c.category)}>{categoryLabel(c.category)}</Badge>
                  {c.has_been_goat && <GoatBadge size="xs" />}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{c.description}</p>
              </div>
              <p className="shrink-0 text-lg font-black tabular-nums">
                {formatPower(c.total_power)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
