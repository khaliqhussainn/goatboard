-- GOATBOARD database schema
-- Run this against a fresh Supabase Postgres project (SQL editor or `supabase db push`).
--
-- There is no Supabase Auth in this product — no login, no email
-- confirmation. Every visitor gets an anonymous `goatboard_uid` cookie
-- (assigned in middleware.ts) that identifies them for vote-limiting and
-- campaign ownership ("my campaigns"). It's a bare uuid with no FK into
-- auth.users. This is a deliberate tradeoff: zero signup friction, at the
-- cost of identity being only as durable as a cookie (clearing cookies
-- resets it). Abuse is bounded server-side by rate limiting instead.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null check (char_length(name) between 1 and 60),
  description text not null check (char_length(description) between 1 and 280),
  destination_url text not null,
  image_url text,
  category text not null default 'other',
  status text not null default 'active' check (status in ('active', 'suspended', 'removed')),
  vote_power integer not null default 0 check (vote_power >= 0),
  paid_power integer not null default 0 check (paid_power >= 0),
  total_power integer generated always as (vote_power + paid_power) stored,
  -- Anonymous visitor id (goatboard_uid cookie), not a Supabase Auth user.
  -- Lets one visitor list multiple campaigns ("my campaigns") without login.
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The ranking query: order by power desc, then by who got there first.
create index if not exists campaigns_ranking_idx
  on public.campaigns (total_power desc, updated_at asc)
  where status = 'active';

create index if not exists campaigns_slug_idx on public.campaigns (slug);
create index if not exists campaigns_category_idx on public.campaigns (category) where status = 'active';
create index if not exists campaigns_created_by_idx on public.campaigns (created_by);

-- Permanent bragging rights: once a campaign reaches #1 this flips to true
-- and never resets, even after it's overtaken. See the campaigns_mark_goat
-- trigger below for how it gets set.
alter table public.campaigns add column if not exists has_been_goat boolean not null default false;

-- `create table if not exists` above is a full no-op on a table that
-- already exists — it does NOT drop old columns/constraints. Early
-- versions of this schema had voter_id/created_by reference auth.users(id);
-- that FK was removed when GOATBOARD dropped Supabase Auth in favor of an
-- anonymous cookie, but a table created under the old schema still has it,
-- which rejects every vote/campaign insert since anonymous visitor ids
-- don't exist in auth.users. Drop it unconditionally so this file
-- converges to the current schema no matter which version ran first.
alter table public.campaigns drop constraint if exists campaigns_created_by_fkey;

-- ---------------------------------------------------------------------------
-- votes  (one free vote per campaign per anonymous visitor per UTC day)
-- ---------------------------------------------------------------------------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  voter_id uuid not null,
  vote_date date not null default (timezone('utc', now()))::date,
  created_at timestamptz not null default now(),
  unique (campaign_id, voter_id, vote_date)
);

create index if not exists votes_campaign_idx on public.votes (campaign_id);
create index if not exists votes_voter_date_idx on public.votes (voter_id, vote_date);

-- Same convergence fix as campaigns_created_by_fkey above, for the other
-- column that used to reference auth.users(id).
alter table public.votes drop constraint if exists votes_voter_id_fkey;

-- ---------------------------------------------------------------------------
-- purchases  (paid Power, $1 = 3 Power)
-- ---------------------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  lemon_squeezy_order_id text unique,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'USD',
  power_granted integer not null check (power_granted > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists purchases_campaign_idx on public.purchases (campaign_id);
create index if not exists purchases_status_idx on public.purchases (status);

-- ---------------------------------------------------------------------------
-- reports  (lightweight moderation queue)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists reports_campaign_idx on public.reports (campaign_id);
create index if not exists reports_status_idx on public.reports (status);

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at
  before update on public.campaigns
  for each row
  when (old.vote_power is distinct from new.vote_power or old.paid_power is distinct from new.paid_power)
  execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- "Once a GOAT, always a GOAT": the instant a campaign's power makes it the
-- highest among active campaigns, has_been_goat flips to true and stays
-- true forever, even after it's overtaken. total_power is a generated
-- column and isn't materialized yet inside a BEFORE trigger, so this
-- computes the same sum manually from vote_power + paid_power.
-- ---------------------------------------------------------------------------
create or replace function public.mark_goat()
returns trigger
language plpgsql
as $$
declare
  v_new_total integer := new.vote_power + new.paid_power;
begin
  if not new.has_been_goat and not exists (
    select 1 from public.campaigns
    where status = 'active'
      and id <> new.id
      and (vote_power + paid_power) > v_new_total
  ) then
    new.has_been_goat := true;
  end if;
  return new;
end;
$$;

drop trigger if exists campaigns_mark_goat on public.campaigns;
create trigger campaigns_mark_goat
  before update on public.campaigns
  for each row
  when (old.vote_power is distinct from new.vote_power or old.paid_power is distinct from new.paid_power)
  execute function public.mark_goat();

-- ---------------------------------------------------------------------------
-- cast_vote(campaign_id, voter_id)
-- Atomically records a daily vote and bumps vote_power. All ranking-affecting
-- writes go through this function (or grant_purchase_power below) so the
-- client can never set power directly. voter_id is the caller's anonymous
-- goatboard_uid, passed in from the trusted API route (never from the body).
-- ---------------------------------------------------------------------------
create or replace function public.cast_vote(p_campaign_id uuid, p_voter_id uuid)
returns table(success boolean, message text, total_power integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_total integer;
begin
  select status into v_status from public.campaigns where id = p_campaign_id for update;

  if v_status is null then
    return query select false, 'campaign_not_found', null::integer;
    return;
  end if;

  if v_status <> 'active' then
    return query select false, 'campaign_not_active', null::integer;
    return;
  end if;

  begin
    insert into public.votes (campaign_id, voter_id, vote_date)
    values (p_campaign_id, p_voter_id, (timezone('utc', now()))::date);
  exception when unique_violation then
    return query select false, 'already_voted', null::integer;
    return;
  end;

  update public.campaigns
    set vote_power = vote_power + 1
    where id = p_campaign_id
    -- Qualified with the table name: cast_vote's own RETURNS TABLE column
    -- is also named total_power, and PL/pgSQL treats that as ambiguous
    -- with the campaigns.total_power column otherwise.
    returning campaigns.total_power into v_total;

  return query select true, 'ok', v_total;
end;
$$;

revoke all on function public.cast_vote(uuid, uuid) from public;
grant execute on function public.cast_vote(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- grant_purchase_power(order_id, campaign_id, amount, currency, power)
-- Idempotent: relies on the unique constraint on lemon_squeezy_order_id.
-- Only ever called from the trusted webhook handler with the service role.
-- ---------------------------------------------------------------------------
create or replace function public.grant_purchase_power(
  p_order_id text,
  p_campaign_id uuid,
  p_amount numeric,
  p_currency text,
  p_power integer
)
returns table(success boolean, message text, total_power integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  begin
    insert into public.purchases (campaign_id, lemon_squeezy_order_id, amount, currency, power_granted, status)
    values (p_campaign_id, p_order_id, p_amount, p_currency, p_power, 'paid');
  exception when unique_violation then
    return query select false, 'already_processed', null::integer;
    return;
  end;

  update public.campaigns
    set paid_power = paid_power + p_power
    where id = p_campaign_id
    -- Same ambiguity fix as cast_vote above.
    returning campaigns.total_power into v_total;

  return query select true, 'ok', v_total;
end;
$$;

revoke all on function public.grant_purchase_power(text, uuid, numeric, text, integer) from public;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- There's no Supabase Auth session, so there's no authenticated role to
-- scope policies by. All writes (campaign creation, votes, image uploads)
-- go through server API routes using the service-role client, which
-- bypasses RLS after its own validation/rate-limiting. RLS here exists to
-- keep reads correctly scoped for the public anon key and to make sure the
-- anon/authenticated roles have no write access at all.
-- ---------------------------------------------------------------------------
alter table public.campaigns enable row level security;
alter table public.votes enable row level security;
alter table public.purchases enable row level security;
alter table public.reports enable row level security;

-- Anyone can read active campaigns; the service role (admin) can read everything.
drop policy if exists "campaigns are publicly readable" on public.campaigns;
create policy "campaigns are publicly readable"
  on public.campaigns for select
  using (status = 'active' or auth.role() = 'service_role');

drop policy if exists "authenticated users can create campaigns" on public.campaigns;

-- No client-side insert/update/delete policy: campaign creation and every
-- power-changing update happens server-side with the service role.

-- Purchases: publicly readable in aggregate (needed for the $ breakdown), but
-- only paid rows, and never writable from the client.
drop policy if exists "paid purchases are publicly readable" on public.purchases;
create policy "paid purchases are publicly readable"
  on public.purchases for select
  using (status = 'paid' or auth.role() = 'service_role');

-- Reports: anyone can file one, nobody can read them back except the service role.
drop policy if exists "anyone can file a report" on public.reports;
create policy "anyone can file a report"
  on public.reports for insert
  with check (true);

drop policy if exists "only admins read reports" on public.reports;
create policy "only admins read reports"
  on public.reports for select
  using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Realtime
-- `alter publication ... add table` errors if the table is already a
-- member — unlike everything else in this file, that's NOT a no-op on a
-- second run. Since the Supabase SQL editor aborts the whole script on the
-- first error, re-running this file used to silently skip every statement
-- below this line (including the entire storage bucket setup). Guarded so
-- this file is safe to run any number of times.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'campaigns'
  ) then
    alter publication supabase_realtime add table public.campaigns;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: campaign images
-- Uploads always go through /api/upload with the service role (validated,
-- rate-limited server-side) — there is no client-side insert policy.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-images',
  'campaign-images',
  true,
  5242880,
  array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    -- favicons fetched from a campaign's own site are frequently .ico/.svg
    'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campaign images are publicly readable" on storage.objects;
create policy "campaign images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'campaign-images');

drop policy if exists "authenticated users can upload campaign images" on storage.objects;
