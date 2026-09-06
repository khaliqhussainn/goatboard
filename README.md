# GOATBOARD

A public competitive billboard. Every campaign fights for one #1 spotlight —
get free daily votes or spend money to gain Power. Take the board. Keep it
until someone beats you.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components, `proxy.ts`)
- **Supabase** — Postgres, Realtime, Storage (no Supabase Auth — see below)
- **Tailwind CSS v4** + hand-rolled shadcn-style primitives
- **Motion** (Framer Motion's successor) for the leaderboard's layout animations
- **Lemon Squeezy** for paid Power purchases

## The core mechanic

- 1 free vote per campaign per visitor per UTC day = **1 Power**
- $1 spent = **3 Power** (via Lemon Squeezy "pay what you want" checkout)
- `total_power = vote_power + paid_power`, ranked descending
- Ties break in favor of whoever reached that Power level first
- All ranking-affecting writes happen through two Postgres functions
  (`cast_vote`, `grant_purchase_power`) called from trusted server code —
  the client can never set power directly. See `supabase/schema.sql`.

## No accounts, no email confirmation

There is no Supabase Auth, no sign-in screen, and no email confirmation
anywhere in the product. `src/proxy.ts` assigns every visitor a random,
anonymous `goatboard_uid` cookie (httpOnly, 2-year expiry) the first time
they show up. That id is the only identity in the system:

- it's the `voter_id` behind the one-vote-per-day limit
- it's the `created_by` on every campaign, which is how `/mine` lists
  "my campaigns" — one person/browser can create and later find as many
  campaigns as they want, with zero signup friction

The tradeoff is explicit: identity only lasts as long as the cookie
(clearing cookies or switching browsers resets it, and nothing stops
someone from doing that to vote again or create more campaigns). Abuse is
bounded server-side instead, with IP+visitor rate limits on votes, campaign
creation, and image uploads (`src/lib/rate-limit.ts`). If you need stronger
guarantees later, add a fingerprinting layer or bring back optional auth —
the RPCs already take an opaque id, so nothing else has to change.

Every write (`/api/votes`, `/api/campaigns`, `/api/upload`, `/api/report`)
runs server-side with the Supabase **service role** key, which is why
there's no client-side insert policy on `campaigns` or the storage bucket
in `supabase/schema.sql` — the server route is the trust boundary, not RLS.

## Getting started

1. Create a Supabase project, then run `supabase/schema.sql` in the SQL editor
   (or `supabase db push`). It creates the tables, RLS policies, ranking
   indexes, the `cast_vote` / `grant_purchase_power` RPCs, realtime
   publication, and the `campaign-images` storage bucket.
2. Copy `.env.example` to `.env.local` and fill in:
   - Supabase URL / anon key (or the newer "publishable" key) / service role
     key (or the newer "secret" key)
   - A Lemon Squeezy store, a single "pay what you want" variant used for
     every boost (the checkout overrides its price per purchase), your API
     key, and the webhook signing secret
   - `ADMIN_PASSWORD` for the `/admin` moderation area
3. In Lemon Squeezy, point a webhook at `/api/webhooks/lemonsqueezy`
   subscribed to the `order_created` event.
4. `npm install && npm run dev`

## Structure

- `src/app` — routes (homepage billboard, `/explore`, `/create`, `/mine`,
  `/campaign/[slug]`, `/admin`, API routes)
- `src/components/billboard` — the leaderboard itself: spotlight, tiles,
  ranking rows, the layout-animated `Leaderboard`/`CampaignSlot`, vote/boost UI
- `src/components/campaign` — campaign creation, preview, sharing, reporting
- `src/components/layout` — navbar, the abstract colorful backdrop
- `src/lib` — Supabase clients, visitor identity, validation, rate limiting,
  Lemon Squeezy
- `src/proxy.ts` — assigns the anonymous visitor cookie on every request
- `supabase/schema.sql` — the entire database, RLS, and RPCs

## Design

The billboard itself is deliberately plain: white cards in light mode,
near-black in dark mode, no borders anywhere — separation from the
backdrop comes from elevation (a soft shadow in light mode, a soft glow in
dark mode; see the `.billboard-surface*` classes in `globals.css`), not a
stroke. It's meant to read as the one thing on the page that matters.

Everything around it is the opposite: `AbstractBackdrop`
(`src/components/layout/abstract-backdrop.tsx`) is a fixed, full-viewport
layer of large flat-colored organic blob shapes — no images, pure CSS —
that gives the product its colorful, internet-native identity without
touching the billboard's black-and-white focus. Swap the `--blob-*` tokens
in `globals.css` to retheme it.

## Notes

- The in-memory rate limiter (`src/lib/rate-limit.ts`) is per server instance —
  swap in Upstash Redis (or similar) if you deploy multiple regions/instances.
- Admin auth is a single shared password (`ADMIN_PASSWORD`), not a full user
  role system — intentionally minimal since GOATBOARD has no user profiles.
