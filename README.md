# GOATBOARD

A public competitive billboard. Every campaign fights for one #1 spotlight —
get free daily votes or spend money to gain Power. Take the board. Keep it
until someone beats you.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components)
- **Supabase** — Postgres, Auth (magic link), Realtime, Storage
- **Tailwind CSS v4** + hand-rolled shadcn-style primitives
- **Motion** (Framer Motion's successor) for the leaderboard's layout animations
- **Lemon Squeezy** for paid Power purchases

## The core mechanic

- 1 free vote per campaign per user per UTC day = **1 Power**
- $1 spent = **3 Power** (via Lemon Squeezy "pay what you want" checkout)
- `total_power = vote_power + paid_power`, ranked descending
- Ties break in favor of whoever reached that Power level first
- All ranking-affecting writes happen through two Postgres functions
  (`cast_vote`, `grant_purchase_power`) called from trusted server code —
  the client can never set power directly. See `supabase/schema.sql`.

## Getting started

1. Create a Supabase project, then run `supabase/schema.sql` in the SQL editor
   (or `supabase db push`). It creates the tables, RLS policies, ranking
   indexes, the `cast_vote` / `grant_purchase_power` RPCs, realtime
   publication, and the `campaign-images` storage bucket.
2. Copy `.env.example` to `.env.local` and fill in:
   - Supabase URL / anon key / service role key
   - A Lemon Squeezy store, a single "pay what you want" variant used for
     every boost (the checkout overrides its price per purchase), your API
     key, and the webhook signing secret
   - `ADMIN_PASSWORD` for the `/admin` moderation area
3. In Lemon Squeezy, point a webhook at `/api/webhooks/lemonsqueezy`
   subscribed to the `order_created` event.
4. `npm install && npm run dev`

## Structure

- `src/app` — routes (homepage billboard, `/explore`, `/create`,
  `/campaign/[slug]`, `/admin`, API routes)
- `src/components/billboard` — the leaderboard itself: spotlight, tiles,
  ranking rows, the layout-animated `Leaderboard`/`CampaignSlot`, vote/boost UI
- `src/components/campaign` — campaign creation, preview, sharing, reporting
- `src/lib` — Supabase clients, validation, rate limiting, Lemon Squeezy
- `supabase/schema.sql` — the entire database, RLS, and RPCs

## Notes

- Voting requires a Supabase magic-link session; browsing and boosting do not.
- The in-memory rate limiter (`src/lib/rate-limit.ts`) is per server instance —
  swap in Upstash Redis (or similar) if you deploy multiple regions/instances.
- Admin auth is a single shared password (`ADMIN_PASSWORD`), not a full user
  role system — intentionally minimal since GOATBOARD has no user profiles.
