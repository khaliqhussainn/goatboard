"use client";

import * as React from "react";
import type { VisitorActivityPoint } from "@/lib/types";

const WIDTH = 240;
const HEIGHT = 64;
const PAD_Y = 8;

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M${points[0].x},${points[0].y} `;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y} `;
  }
  return d;
}

export function VisitorActivityChart({ activity }: { activity: VisitorActivityPoint[] }) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const points = React.useMemo(() => {
    if (activity.length === 0) return [];
    const max = Math.max(...activity.map((p) => p.visits), 1);
    const stepX = activity.length > 1 ? WIDTH / (activity.length - 1) : 0;
    return activity.map((p, i) => ({
      x: i * stepX,
      y: HEIGHT - PAD_Y - (p.visits / max) * (HEIGHT - PAD_Y * 2),
      visits: p.visits,
      hour: p.hour,
    }));
  }, [activity]);

  if (points.length === 0) {
    return (
      <div className="flex h-10 items-center justify-center text-[11px] text-muted-foreground sm:h-12">
        No activity yet
      </div>
    );
  }

  const linePath = smoothPath(points);
  const areaPath = `${linePath}L${points[points.length - 1].x},${HEIGHT} L${points[0].x},${HEIGHT} Z`;
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (points.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), points.length - 1));
  }

  return (
    <div
      ref={containerRef}
      className="relative h-10 w-full touch-none sm:h-12"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="visitor-activity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--hero-green)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--hero-green)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#visitor-activity-fill)" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--hero-green)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={0}
              y2={HEIGHT}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r="4"
              fill="var(--hero-green)"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute bottom-full z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground px-2 py-1 text-[11px] font-semibold text-background shadow-md"
          style={{
            left: `${Math.min(Math.max((hoverIndex! / (points.length - 1)) * 100, 8), 92)}%`,
          }}
        >
          {new Date(hovered.hour).toLocaleTimeString("en-US", { hour: "numeric" })} ·{" "}
          {hovered.visits.toLocaleString("en-US")} {hovered.visits === 1 ? "visit" : "visits"}
        </div>
      )}
    </div>
  );
}
