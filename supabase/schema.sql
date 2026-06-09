-- QueryDesk — Supabase schema for per-user synced query streams.
-- Run once in the Supabase dashboard → SQL Editor.
--
-- Auth: Clerk is connected as a Third-Party Auth provider, so the Clerk session
-- JWT's `sub` claim (the Clerk user id, "user_…") identifies the row owner.
-- Row-Level Security restricts every row to its owner.

-- ---------- tables ----------
create table if not exists public.streams (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  query       text not null default '',
  filters     jsonb not null default '{}'::jsonb,
  notes       text not null default '',
  position    int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_streams_user on public.streams(user_id);

create table if not exists public.external_papers (
  id          uuid primary key default gen_random_uuid(),
  stream_id   uuid not null references public.streams(id) on delete cascade,
  user_id     text not null,
  col         text not null default 'journal',
  title       text,
  authors     jsonb not null default '[]'::jsonb,
  year        int,
  venue       text,
  doi         text,
  url         text,
  abstract    text,
  keywords    jsonb not null default '[]'::jsonb,
  emb         text,            -- base64 of int8 bge-small vector (for ranking)
  provenance  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_ext_stream on public.external_papers(stream_id);

create table if not exists public.pins (
  id          uuid primary key default gen_random_uuid(),
  stream_id   uuid not null references public.streams(id) on delete cascade,
  user_id     text not null,
  paper_id    text not null,
  col         text not null,
  created_at  timestamptz not null default now(),
  unique (stream_id, paper_id)
);
create index if not exists idx_pins_stream on public.pins(stream_id);

-- ---------- row-level security ----------
alter table public.streams         enable row level security;
alter table public.external_papers enable row level security;
alter table public.pins            enable row level security;

-- The Clerk user id is the JWT `sub`. Each policy lets a user touch only rows
-- they own. (drop-if-exists first so the script is re-runnable.)
drop policy if exists "own streams"  on public.streams;
create policy "own streams" on public.streams
  for all
  using  (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "own externals" on public.external_papers;
create policy "own externals" on public.external_papers
  for all
  using  (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "own pins" on public.pins;
create policy "own pins" on public.pins
  for all
  using  (user_id = (auth.jwt() ->> 'sub'))
  with check (user_id = (auth.jwt() ->> 'sub'));
