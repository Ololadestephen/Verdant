create extension if not exists postgis;
create extension if not exists pgcrypto;

create type public.session_status as enum ('active', 'pending_verification', 'completed', 'failed', 'expired');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.nft_status as enum ('pending', 'minted', 'failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_wallet_address()
returns text
language sql
stable
as $$
  select nullif(lower(coalesce(auth.jwt() ->> 'wallet_address', '')), '');
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique check (wallet_address = lower(wallet_address)),
  username text,
  avatar_url text,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  total_earned numeric(24, 8) not null default 0 check (total_earned >= 0),
  total_verified_submissions integer not null default 0 check (total_verified_submissions >= 0),
  last_submission_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stake_amount numeric(24, 8) not null check (stake_amount > 0),
  stake_tx_hash text not null,
  status public.session_status not null default 'active',
  started_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists sessions_one_active_per_profile
on public.sessions(profile_id)
where status in ('active', 'pending_verification');

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  image_path text not null,
  image_sha256 text not null,
  image_phash text,
  captured_at timestamptz not null,
  submitted_at timestamptz not null default timezone('utc', now()),
  location geography(point, 4326) not null,
  ai_confidence numeric(5, 4),
  ai_labels jsonb not null default '[]'::jsonb,
  verification_status public.verification_status not null default 'pending',
  rejection_reason text,
  reward_amount numeric(24, 8) not null default 0,
  verifier_version text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists submissions_unique_sha_per_profile
on public.submissions(profile_id, image_sha256);

create index if not exists submissions_profile_submitted_desc
on public.submissions(profile_id, submitted_at desc);

create index if not exists submissions_location_gix
on public.submissions using gist(location);

create table if not exists public.nfts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  milestone_day integer not null check (milestone_day in (7, 30, 100)),
  token_id text,
  mint_tx_hash text,
  status public.nft_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(profile_id, milestone_day)
);

create index if not exists profiles_total_earned_desc_idx
on public.profiles(total_earned desc, created_at asc);

create or replace view public.leaderboard as
select
  p.id,
  p.wallet_address,
  p.username,
  p.avatar_url,
  p.current_streak,
  p.best_streak,
  p.total_earned,
  p.total_verified_submissions,
  rank() over (order by p.total_earned desc, p.created_at asc) as rank
from public.profiles p;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger sessions_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

create trigger submissions_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

create trigger nfts_updated_at
before update on public.nfts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.submissions enable row level security;
alter table public.nfts enable row level security;

create policy "profiles_public_read"
on public.profiles
for select
using (true);

create policy "profiles_self_update"
on public.profiles
for update
using (wallet_address = public.current_wallet_address())
with check (wallet_address = public.current_wallet_address());

create policy "profiles_self_insert"
on public.profiles
for insert
with check (wallet_address = public.current_wallet_address());

create policy "sessions_self_read"
on public.sessions
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = sessions.profile_id
      and p.wallet_address = public.current_wallet_address()
  )
);

create policy "sessions_self_write"
on public.sessions
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = sessions.profile_id
      and p.wallet_address = public.current_wallet_address()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = sessions.profile_id
      and p.wallet_address = public.current_wallet_address()
  )
);

create policy "submissions_self_read"
on public.submissions
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = submissions.profile_id
      and p.wallet_address = public.current_wallet_address()
  )
);

create policy "submissions_self_write"
on public.submissions
for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = submissions.profile_id
      and p.wallet_address = public.current_wallet_address()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = submissions.profile_id
      and p.wallet_address = public.current_wallet_address()
  )
);

create policy "nfts_public_read"
on public.nfts
for select
using (true);

create policy "nfts_self_read"
on public.nfts
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = nfts.profile_id
      and p.wallet_address = public.current_wallet_address()
  )
);

insert into storage.buckets (id, name, public)
values ('grass-photos', 'grass-photos', false)
on conflict (id) do nothing;

create policy "bucket_authenticated_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'grass-photos'
  and owner = auth.uid()
);

create policy "bucket_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'grass-photos'
  and owner = auth.uid()
);

create policy "bucket_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'grass-photos'
  and owner = auth.uid()
)
with check (
  bucket_id = 'grass-photos'
  and owner = auth.uid()
);
