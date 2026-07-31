-- Pulse: two-way alignment signals (leaders, petitions, signatures, responses)
-- Shared LPL Supabase. Service-role only; RLS on, no public policies.

create table if not exists pulse_leaders (
  id text primary key,
  name text not null,
  title text not null,
  kind text not null,
  jurisdiction text not null,
  contact_note text,
  created_at timestamptz not null default now()
);

create table if not exists pulse_petitions (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  body text not null,
  ask text not null,
  category text not null default 'General',
  featured boolean not null default false,
  status text not null default 'open',
  leader_id text not null references pulse_leaders(id),
  created_at timestamptz not null default now(),
  created_by_name text not null default 'Neighbor',
  hosted_not_endorsed boolean not null default true
);

create table if not exists pulse_signatures (
  id text primary key,
  petition_id text not null references pulse_petitions(id) on delete cascade,
  name text not null,
  email text not null,
  city text not null,
  state text not null default 'GA',
  intensity integer not null check (intensity between 1 and 5),
  why text,
  signed_at timestamptz not null default now(),
  unique (petition_id, email)
);

create index if not exists pulse_signatures_petition_idx
  on pulse_signatures (petition_id, signed_at desc);

create table if not exists pulse_responses (
  id text primary key,
  petition_id text not null references pulse_petitions(id) on delete cascade,
  leader_id text not null references pulse_leaders(id),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists pulse_responses_petition_idx
  on pulse_responses (petition_id, created_at desc);

alter table pulse_leaders enable row level security;
alter table pulse_petitions enable row level security;
alter table pulse_signatures enable row level security;
alter table pulse_responses enable row level security;
