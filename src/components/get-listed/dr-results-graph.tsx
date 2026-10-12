import { BarChart3, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GetListedDrProject } from "@/lib/types";

const BAR_COLORS = ["bg-hero-yellow", "bg-hero-purple", "bg-hero-teal"];
const VALUE_COLORS = [
  "bg-accent-yellow text-yellow-950",
  "bg-accent-purple text-purple-950",
  "bg-accent-green text-green-950",
];

export function DrResultsGraph({ projects }: { projects: GetListedDrProject[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="billboard-surface-lg overflow-hidden rounded-[2rem] p-5 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-green px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-green-900">
              <BarChart3 className="size-3.5" aria-hidden />
              Distribution results
            </span>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">
              Domain Rating across our projects
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Current DR for three products distributed through GoatBoard&apos;s Get Listed service.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Scale: 0–100</p>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          {projects.map((project, index) => (
            <div key={project.key} className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_4.5rem] sm:items-center">
              <a
                href={`https://${project.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group min-w-0"
              >
                <span className="flex items-center gap-1.5 font-black tracking-tight group-hover:underline">
                  {project.site_name}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </span>
                <span className="block truncate text-xs text-muted-foreground">{project.domain}</span>
              </a>

              <div
                className="relative h-4 overflow-hidden rounded-full bg-black/[0.07] ring-1 ring-inset ring-black/5"
                role="img"
                aria-label={`${project.site_name} has a Domain Rating of ${project.dr} out of 100`}
              >
                <span aria-hidden className="absolute inset-y-0 left-1/4 w-px bg-black/[0.08]" />
                <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-black/[0.08]" />
                <span aria-hidden className="absolute inset-y-0 left-3/4 w-px bg-black/[0.08]" />
                <span
                  aria-hidden
                  style={{ width: `${project.dr}%` }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700",
                    BAR_COLORS[index % BAR_COLORS.length],
                  )}
                />
                {project.dr === 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 size-2 -translate-y-1/2 rounded-full",
                      BAR_COLORS[index % BAR_COLORS.length],
                    )}
                  />
                )}
              </div>

              <div
                className={cn(
                  "flex w-fit items-baseline gap-1 rounded-xl px-3 py-2 sm:ml-auto",
                  VALUE_COLORS[index % VALUE_COLORS.length],
                )}
              >
                <span className="text-2xl font-black tabular-nums">{project.dr}</span>
                <span className="text-[10px] font-black uppercase tracking-wide">DR</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 hidden grid-cols-5 text-[10px] font-semibold text-muted-foreground sm:grid sm:pl-48 sm:pr-[4.5rem]">
          {[0, 25, 50, 75, 100].map((tick) => (
            <span key={tick} className={cn(tick === 100 ? "text-right" : tick > 0 ? "text-center" : "text-left")}>
              {tick}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
