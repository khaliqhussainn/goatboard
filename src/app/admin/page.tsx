import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CampaignStatusActions, ReportActions } from "@/components/admin/admin-actions";
import { AdSlotAdminPanel } from "@/components/admin/ad-slot-admin-panel";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatPower } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const admin = createAdminClient();

  let campaignsQuery = admin
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    campaignsQuery = campaignsQuery.ilike("name", `%${q}%`);
  }

  const [{ data: campaigns }, { data: reports }, { data: purchases }, { data: adSlots }] =
    await Promise.all([
      campaignsQuery,
      admin
        .from("reports")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50),
      admin.from("purchases").select("*").order("created_at", { ascending: false }).limit(50),
      admin.from("ad_slots").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

  const referencedIds = Array.from(
    new Set([...(reports ?? []).map((r) => r.campaign_id), ...(purchases ?? []).map((p) => p.campaign_id)]),
  );

  const { data: referencedCampaigns } = referencedIds.length
    ? await admin.from("campaigns").select("id, name, slug").in("id", referencedIds)
    : { data: [] };

  const campaignById = new Map((referencedCampaigns ?? []).map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Admin</h1>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </form>
      </div>

      <section className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Campaigns</h2>
          <form className="w-56">
            <Input name="q" placeholder="Search by name…" defaultValue={q ?? ""} />
          </form>
        </div>
        <div className="flex flex-col gap-2">
          {(campaigns ?? []).map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
            >
              <Link href={`/campaign/${c.slug}`} className="font-semibold hover:underline">
                {c.name}
              </Link>
              <Badge
                variant={c.status === "active" ? "green" : c.status === "suspended" ? "yellow" : "pink"}
              >
                {c.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatPower(c.total_power)} Power
              </span>
              <div className="ml-auto">
                <CampaignStatusActions id={c.id} status={c.status} />
              </div>
            </div>
          ))}
          {(campaigns ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No campaigns found.</p>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-bold">Open reports</h2>
        <div className="flex flex-col gap-2">
          {(reports ?? []).map((r) => {
            const campaign = campaignById.get(r.campaign_id);
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3"
              >
                <Link
                  href={campaign ? `/campaign/${campaign.slug}` : "#"}
                  className="font-semibold hover:underline"
                >
                  {campaign?.name ?? "Unknown campaign"}
                </Link>
                <span className="text-sm text-muted-foreground">{r.reason}</span>
                <div className="ml-auto">
                  <ReportActions id={r.id} />
                </div>
              </div>
            );
          })}
          {(reports ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No open reports.</p>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-bold">Recent purchases</h2>
        <div className="flex flex-col gap-2">
          {(purchases ?? []).map((p) => {
            const campaign = campaignById.get(p.campaign_id);
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <span className="font-semibold">{campaign?.name ?? "Unknown"}</span>
                <span className="text-muted-foreground">{formatMoney(p.amount, p.currency)}</span>
                <span className="text-muted-foreground">+{p.power_granted} Power</span>
                <Badge variant={p.status === "paid" ? "green" : "outline"} className="ml-auto">
                  {p.status}
                </Badge>
              </div>
            );
          })}
          {(purchases ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Ad slot</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Create a slot for free to test the homepage ad without going through checkout, or end/
          delete one below.
        </p>
        <AdSlotAdminPanel adSlots={adSlots ?? []} />
      </section>
    </div>
  );
}
