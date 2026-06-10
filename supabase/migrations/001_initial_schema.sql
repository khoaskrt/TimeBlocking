-- ============================================================
-- RyanDo.com — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- AREAS
-- ============================================================
create table areas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null check (color in ('blue','green','purple','orange','red','yellow','pink','gray')),
  icon       text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CAPTURES (Quick Capture inbox)
-- ============================================================
create table captures (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  area_id    uuid references areas(id) on delete set null,
  processed  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROJECTS (one-time)
-- ============================================================
create table projects (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  description      text,
  area_id          uuid references areas(id) on delete set null,
  status           text not null default 'active' check (status in ('active','done','paused')),
  last_activity_at timestamptz not null default now(),
  start_date       date,
  end_date         date,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- TASKS
-- ============================================================
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  due_date    date,
  area_id     uuid references areas(id) on delete set null,
  project_id  uuid references projects(id) on delete set null,
  status      text not null default 'todo' check (status in ('todo','done')),
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  pinned_top3 boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- RETAINERS (monthly recurring clients)
-- ============================================================
create table retainers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  client_name text,
  area_id     uuid references areas(id) on delete set null,
  billing_day smallint check (billing_day between 1 and 31),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table retainer_templates (
  id          uuid primary key default gen_random_uuid(),
  retainer_id uuid not null references retainers(id) on delete cascade,
  title       text not null,
  "order"     smallint not null default 0
);

create table retainer_cycles (
  id          uuid primary key default gen_random_uuid(),
  retainer_id uuid not null references retainers(id) on delete cascade,
  month       smallint not null check (month between 1 and 12),
  year        smallint not null,
  created_at  timestamptz not null default now(),
  unique (retainer_id, month, year)
);

create table retainer_items (
  id           uuid primary key default gen_random_uuid(),
  cycle_id     uuid not null references retainer_cycles(id) on delete cascade,
  template_id  uuid references retainer_templates(id) on delete set null,
  title        text not null,
  completed    boolean not null default false,
  completed_at timestamptz
);

-- ============================================================
-- ROUTINES (daily time blocks)
-- ============================================================
create table routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  time_block  text not null check (time_block in ('morning','afternoon','evening')),
  area_id     uuid references areas(id) on delete set null,
  active      boolean not null default true,
  "order"     smallint not null default 0,
  created_at  timestamptz not null default now()
);

create table routine_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references routines(id) on delete cascade,
  date       date not null,
  completed  boolean not null default false,
  unique (routine_id, date)
);

-- ============================================================
-- HABITS (streak-based)
-- ============================================================
create table habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  area_id     uuid references areas(id) on delete set null,
  frequency   text not null default 'daily' check (frequency in ('daily','weekly')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table habit_logs (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  date     date not null,
  unique (habit_id, date)
);

-- ============================================================
-- NOTES (with resurfacing)
-- ============================================================
create table notes (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  title                  text not null,
  content                text,
  tags                   text[] not null default '{}',
  area_id                uuid references areas(id) on delete set null,
  source_url             text,
  resurface_interval_days int not null default 30,
  last_resurfaced_at     timestamptz,
  created_at             timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index on captures (user_id, processed);
create index on tasks (user_id, status, due_date);
create index on tasks (user_id, pinned_top3) where pinned_top3 = true;
create index on projects (user_id, status, last_activity_at);
create index on retainer_cycles (retainer_id, year, month);
create index on routine_logs (user_id, date);
create index on habit_logs (user_id, date);
create index on notes (user_id, last_resurfaced_at);
