import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllGetListedCampaigns } from "@/lib/queries/get-listed";
import { GetListedAdminPanel } from "@/components/admin/get-listed-admin-panel";

export const metadata: Metadata = {
  title: "Get Listed admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GetListedAdminPage() {
  await requireAdmin();
  const rows = await listAllGetListedCampaigns();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Get Listed</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} campaign{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/admin" className="text-sm underline underline-offset-4">
          Back to admin
        </Link>
      </div>

      <GetListedAdminPanel rows={rows} />
    </div>
  );
}
