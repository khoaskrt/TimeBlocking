-- Monthly cycles for retainer-style projects.

create table if not exists project_retainer_cycles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  month_start date not null,
  created_at  timestamptz not null default now(),
  unique (project_id, month_start)
);

alter table project_checklist_items
  add column if not exists completed_at timestamptz;

alter table project_checklist_items
  drop constraint if exists project_checklist_items_cycle_id_fkey,
  add constraint project_checklist_items_cycle_id_fkey
    foreign key (cycle_id) references project_retainer_cycles(id) on delete set null;

alter table project_retainer_cycles enable row level security;

drop policy if exists "project_retainer_cycles: user owns" on project_retainer_cycles;
create policy "project_retainer_cycles: user owns" on project_retainer_cycles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists project_retainer_cycles_project_month_idx
  on project_retainer_cycles (project_id, month_start desc);

create index if not exists project_checklist_items_cycle_order_idx
  on project_checklist_items (cycle_id, "order", created_at);
