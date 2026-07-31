-- Phase A: fork parent, seat rationale, leader notices

alter table pulse_petitions add column if not exists parent_id text references pulse_petitions(id);
alter table pulse_petitions add column if not exists why_this_seat text not null default '';
alter table pulse_petitions add column if not exists locale_label text not null default '';

create index if not exists pulse_petitions_parent_idx on pulse_petitions (parent_id);

alter table pulse_leaders add column if not exists notify_email text;
alter table pulse_leaders add column if not exists why_they_act text not null default '';

create table if not exists pulse_notices (
  id text primary key,
  petition_id text not null references pulse_petitions(id) on delete cascade,
  leader_id text not null references pulse_leaders(id),
  channel text not null default 'in_app',
  -- in_app | copy_email | mailto
  status text not null default 'recorded',
  -- recorded | claimed_seen | responded
  subject text not null,
  body text not null,
  sent_by_name text not null default 'Neighbor',
  sent_by_email text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists pulse_notices_leader_idx
  on pulse_notices (leader_id, created_at desc);
create index if not exists pulse_notices_petition_idx
  on pulse_notices (petition_id, created_at desc);

alter table pulse_notices enable row level security;
