"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CampaignStatus, ReportStatus } from "@/lib/types";

export function CampaignStatusActions({
  id,
  status,
}: {
  id: string;
  status: CampaignStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function setStatus(next: CampaignStatus) {
    setLoading(true);
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't update campaign.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      {status !== "active" && (
        <Button size="sm" variant="outline" disabled={loading} onClick={() => setStatus("active")}>
          Activate
        </Button>
      )}
      {status !== "suspended" && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => setStatus("suspended")}
        >
          Suspend
        </Button>
      )}
      {status !== "removed" && (
        <Button size="sm" variant="outline" disabled={loading} onClick={() => setStatus("removed")}>
          Remove
        </Button>
      )}
    </div>
  );
}

export function ReportActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function setStatus(next: ReportStatus) {
    setLoading(true);
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Couldn't update report.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      <Button size="sm" variant="outline" disabled={loading} onClick={() => setStatus("resolved")}>
        Resolve
      </Button>
      <Button size="sm" variant="outline" disabled={loading} onClick={() => setStatus("dismissed")}>
        Dismiss
      </Button>
    </div>
  );
}
