import { NextResponse } from "next/server";
import { getVisitorStats } from "@/lib/queries/visitors";

/** Polled by VisitorStatsCard every ~20s to refresh the total/live/activity numbers. */
export async function GET() {
  const stats = await getVisitorStats();
  return NextResponse.json(stats);
}
