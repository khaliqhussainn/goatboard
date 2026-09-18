import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, SupabaseConfigError } from "@/lib/supabase/admin";
import { getVisitorId, VISITOR_COOKIE } from "@/lib/visitor";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const voteSchema = z.object({ campaignId: z.string().uuid() });

// Generic outward messages only - never anything that describes *how* a
// request was rejected (no "your IP has already voted", no mention of
// tokens, signatures, or rate limits). Server logs carry the specifics.
const GENERIC_UNAVAILABLE = { success: false, message: "vote_unavailable" } as const;
const GENERIC_RATE_LIMITED = { success: false, message: "rate_limited" } as const;

/**
 * Casts a free vote.
 *
 * Layered defenses, in order:
 *  1. An IP-keyed burst limiter, checked before the body is even parsed, so
 *     rapid/malformed requests are cut off regardless of what's in them.
 *  2. A verified visitor identity (see lib/visitor.ts) - a missing or
 *     tampered cookie is rejected here, not patched around client-side.
 *  3. A per-visitor limiter, generous enough for normal use, to stop one
 *     session hammering the endpoint.
 *  4. The actual vote, via cast_vote - a security-definer RPC that owns the
 *     atomic (campaign_id, voter_id, UTC date) uniqueness check at the
 *     database level. This is the only thing that can ever change
 *     campaigns.vote_power; nothing here computes or trusts a power value.
 *  5. A per-(IP, campaign) daily ceiling on vote attempts. Identity is
 *     self-assigned in a login-free system, so it can be discarded and
 *     re-minted on request; this is the layer that actually bounds someone
 *     doing that repeatedly against one campaign. It counts every attempt,
 *     not just successes (a rate limiter is a single atomic check-and-
 *     increment, and splitting that into "peek, then only count on success"
 *     would race between the two steps) - set generously enough that a
 *     shared IP (office, NAT, mobile carrier) with several genuine voters,
 *     plus a few accidental double-clicks, isn't falsely blocked.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  // Layer 1: IP burst limit, ahead of any parsing. Applies to every request
  // shape - valid, malformed, or otherwise - so flooding can't dodge it by
  // sending garbage.
  const burst = rateLimit(`vote-burst:${ip}`, { limit: 20, windowMs: 60 * 1000 });
  if (!burst.success) {
    console.warn("vote rejected: ip burst limit", { ip });
    return NextResponse.json(GENERIC_RATE_LIMITED, { status: 429 });
  }

  const visitorId = await getVisitorId();
  if (!visitorId) {
    // Distinguish "no cookie at all" from "cookie present but didn't verify"
    // for server logs only - the client sees the same generic outcome
    // either way, and identity is decided purely from the verified cookie,
    // never anything else in the request.
    const hadCookieHeader = (request.headers.get("cookie") ?? "").includes(`${VISITOR_COOKIE}=`);
    if (hadCookieHeader) {
      console.warn("vote rejected: invalid or unsigned visitor token", { ip });
      // Stricter limiter for traffic actively presenting bad tokens - a
      // present-but-invalid signature is a stronger abuse signal than a
      // first-time visitor who simply has no cookie yet.
      const invalid = rateLimit(`vote-invalid-token:${ip}`, { limit: 5, windowMs: 60 * 1000 });
      if (!invalid.success) {
        return NextResponse.json(GENERIC_RATE_LIMITED, { status: 429 });
      }
    } else {
      console.warn("vote rejected: no visitor token", { ip });
    }
    return NextResponse.json(GENERIC_UNAVAILABLE, { status: 400 });
  }

  // Layer 3: per-visitor limit. Keyed on the verified id alone (not
  // combined with IP) so it means what it says - this session, not this
  // network - and can't be reset by an attacker varying IPs instead of
  // identity.
  const perVisitor = rateLimit(`vote-voter:${visitorId}`, { limit: 30, windowMs: 60 * 1000 });
  if (!perVisitor.success) {
    console.warn("vote rejected: per-visitor rate limit", { ip });
    return NextResponse.json(GENERIC_RATE_LIMITED, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "invalid_input" }, { status: 400 });
  }

  // Layer 5: has this IP already made its generous daily allowance of vote
  // attempts against this campaign? This is what actually bounds an
  // attacker who keeps discarding the cookie to get a "fresh" identity each
  // time - every attempt still lands in the same IP+campaign bucket no
  // matter how many identities it's spread across.
  const ipDaily = rateLimit(`vote-ip-daily:${ip}:${parsed.data.campaignId}`, {
    limit: 15,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!ipDaily.success) {
    console.warn("vote rejected: ip daily ceiling for campaign", {
      ip,
      campaignId: parsed.data.campaignId,
    });
    return NextResponse.json(GENERIC_RATE_LIMITED, { status: 429 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("cast_vote", {
      p_campaign_id: parsed.data.campaignId,
      p_voter_id: visitorId,
    });

    if (error) {
      console.error("cast_vote failed", error);
      return NextResponse.json(
        { success: false, message: "server_error", detail: error.message },
        { status: 500 },
      );
    }

    const result = data?.[0];
    if (!result?.success) {
      // already_voted is the one outcome the frontend gives a friendly,
      // specific toast for - it doesn't describe any detection mechanism,
      // just the rule itself, so it stays as-is.
      const status = result?.message === "campaign_not_found" ? 404 : 200;
      return NextResponse.json(
        { success: false, message: result?.message ?? "vote_failed" },
        { status },
      );
    }

    console.info("vote cast", { campaignId: parsed.data.campaignId });
    return NextResponse.json({ success: true, totalPower: result.total_power });
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(error.message);
      return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
    }
    console.error("vote crashed", error);
    return NextResponse.json({ success: false, message: "server_error" }, { status: 500 });
  }
}
