-- Pulse accounts, verification ladder, leader seat claims (LPL Supabase)

create table if not exists pulse_people (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  name text not null,
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  street text not null default '',
  email_verified boolean not null default false,
  place_confirmed boolean not null default false,
  address_status text not null default 'none',
  -- none | self_reported | pending | verified
  verification_level integer not null default 1,
  -- 1 account, 2 place, 3 address-tier, 4 strong id
  is_leader boolean not null default false,
  leader_id text references pulse_leaders(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pulse_people_email_idx on pulse_people (email);

create table if not exists pulse_sessions (
  token text primary key,
  person_id text not null references pulse_people(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists pulse_sessions_person_idx on pulse_sessions (person_id);

create table if not exists pulse_leader_claims (
  id text primary key,
  leader_id text not null references pulse_leaders(id),
  person_id text not null references pulse_people(id) on delete cascade,
  status text not null default 'pending',
  -- pending | verified | rejected
  note text,
  created_at timestamptz not null default now(),
  unique (leader_id, person_id)
);

-- Signature verification snapshot (how strong was this signature when cast)
alter table pulse_signatures add column if not exists verification_level integer not null default 1;
alter table pulse_signatures add column if not exists person_id text;
alter table pulse_signatures add column if not exists zip text not null default '';
alter table pulse_signatures add column if not exists address_status text not null default 'none';

alter table pulse_people enable row level security;
alter table pulse_sessions enable row level security;
alter table pulse_leader_claims enable row level security;
