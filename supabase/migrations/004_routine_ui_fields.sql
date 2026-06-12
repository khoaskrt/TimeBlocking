-- ============================================================
-- Routine UI persistence fields
-- ============================================================

alter table routines
  add column if not exists description text not null default '',
  add column if not exists frequency text not null default 'daily',
  add column if not exists routine_time time,
  add column if not exists remind boolean not null default false,
  add column if not exists goal text not null default 'ongoing',
  add column if not exists goal_days smallint;

alter table routines
  drop constraint if exists routines_frequency_check,
  add constraint routines_frequency_check check (frequency in ('daily','weekdays','mwf'));

alter table routines
  drop constraint if exists routines_goal_check,
  add constraint routines_goal_check check (goal in ('ongoing','7','21','30','custom'));

alter table routines
  drop constraint if exists routines_goal_days_check,
  add constraint routines_goal_days_check check (goal_days is null or goal_days >= 1);

create index if not exists routines_user_active_block_order_idx
  on routines (user_id, active, time_block, "order");
