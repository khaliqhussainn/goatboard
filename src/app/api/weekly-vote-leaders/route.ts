import { NextResponse } from "next/server";
import { getWeeklyVoteLeaders } from "@/lib/queries/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getWeeklyVoteLeaders(), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
