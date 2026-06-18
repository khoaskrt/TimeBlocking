-- ============================================================
-- Year goals for Today motivation
-- ============================================================

create table if not exists year_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(trim(title)) > 0 and char_length(title) <= 120),
  note        text check (note is null or char_length(note) <= 180),
  year        smallint not null,
  area_id     uuid references areas(id) on delete set null,
  is_focus    boolean not null default false,
  archived_at timestamptz,
  "order"     smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists year_goals_user_year_active_order_idx
  on year_goals (user_id, year, archived_at, "order");

alter table year_goals enable row level security;

drop policy if exists "year_goals: user owns" on year_goals;
create policy "year_goals: user owns" on year_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
