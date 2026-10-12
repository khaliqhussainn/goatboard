"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GetListedDrProject } from "@/lib/types";

export function GetListedDrAdminPanel({
  initialProjects,
}: {
  initialProjects: GetListedDrProject[];
}) {
  const router = useRouter();
  const [projects, setProjects] = React.useState(initialProjects);
  const [saving, setSaving] = React.useState(false);

  function updateProject(
    key: GetListedDrProject["key"],
    field: "site_name" | "domain" | "dr",
    value: string,
  ) {
    setProjects((current) =>
      current.map((project) =>
        project.key === key
          ? { ...project, [field]: field === "dr" ? Number(value) : value }
          : project,
      ),
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin/get-listed/dr-projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projects: projects.map(({ key, site_name, domain, dr }) => ({
            key,
            site_name,
            domain,
            dr,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message ?? "Couldn't update the DR graph.");
        return;
      }

      toast.success("DR graph updated.");
      router.refresh();
    } catch {
      toast.error("Couldn't update the DR graph.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">
            <BarChart3 className="size-5" aria-hidden />
            Public DR graph
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These three values appear on the public Get Listed service page.
          </p>
        </div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Save graph"}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <div
            key={project.key}
            className="grid grid-cols-1 gap-3 rounded-xl bg-muted/45 p-3 sm:grid-cols-[1fr_1fr_7rem]"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${project.key}-name`}>Project name</Label>
              <Input
                id={`${project.key}-name`}
                value={project.site_name}
                onChange={(event) => updateProject(project.key, "site_name", event.target.value)}
                maxLength={80}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${project.key}-domain`}>Domain</Label>
              <Input
                id={`${project.key}-domain`}
                value={project.domain}
                onChange={(event) => updateProject(project.key, "domain", event.target.value)}
                placeholder="example.com"
                maxLength={253}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${project.key}-dr`}>DR (0–100)</Label>
              <Input
                id={`${project.key}-dr`}
                type="number"
                min={0}
                max={100}
                value={project.dr}
                onChange={(event) => updateProject(project.key, "dr", event.target.value)}
                required
              />
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
