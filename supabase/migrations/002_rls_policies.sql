-- ============================================================
-- RyanDo.com — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table areas             enable row level security;
alter table captures          enable row level security;
alter table projects          enable row level security;
alter table tasks             enable row level security;
alter table retainers         enable row level security;
alter table retainer_templates enable row level security;
alter table retainer_cycles   enable row level security;
alter table retainer_items    enable row level security;
alter table routines          enable row level security;
alter table routine_logs      enable row level security;
alter table habits            enable row level security;
alter table habit_logs        enable row level security;
alter table notes             enable row level security;

-- ============================================================
-- Helper: tables owned directly by user_id
-- ============================================================

-- AREAS
create policy "areas: user owns" on areas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CAPTURES
create policy "captures: user owns" on captures
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PROJECTS
create policy "projects: user owns" on projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASKS
create policy "tasks: user owns" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RETAINERS
create policy "retainers: user owns" on retainers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ROUTINES
create policy "routines: user owns" on routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ROUTINE LOGS
create policy "routine_logs: user owns" on routine_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- HABITS
create policy "habits: user owns" on habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- HABIT LOGS
create policy "habit_logs: user owns" on habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTES
create policy "notes: user owns" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Child tables (scoped via parent ownership)
-- ============================================================

-- RETAINER TEMPLATES — accessible if user owns the parent retainer
create policy "retainer_templates: via retainer" on retainer_templates
  for all using (
    exists (
      select 1 from retainers
      where retainers.id = retainer_templates.retainer_id
        and retainers.user_id = auth.uid()
    )
  );

-- RETAINER CYCLES — accessible if user owns the parent retainer
create policy "retainer_cycles: via retainer" on retainer_cycles
  for all using (
    exists (
      select 1 from retainers
      where retainers.id = retainer_cycles.retainer_id
        and retainers.user_id = auth.uid()
    )
  );

-- RETAINER ITEMS — accessible if user owns the parent cycle → retainer
create policy "retainer_items: via cycle" on retainer_items
  for all using (
    exists (
      select 1 from retainer_cycles
      join retainers on retainers.id = retainer_cycles.retainer_id
      where retainer_cycles.id = retainer_items.cycle_id
        and retainers.user_id = auth.uid()
    )
  );

-- ============================================================
-- Trigger: update projects.last_activity_at on task change
-- ============================================================
create or replace function update_project_activity()
returns trigger language plpgsql security definer as $$
begin
  if new.project_id is not null then
    update projects
    set last_activity_at = now()
    where id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger task_updates_project_activity
  after insert or update on tasks
  for each row execute function update_project_activity();
