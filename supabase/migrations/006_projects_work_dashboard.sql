-- ============================================================
-- Projects work dashboard persistence
-- ============================================================

alter table areas
  add column if not exists ui_color text;

alter table projects
  add column if not exists ui_color text,
  add column if not exists project_kind text not null default 'project',
  add column if not exists quoted_hours numeric(8, 2),
  add column if not exists monthly_hours numeric(8, 2),
  add column if not exists sort_order integer not null default 0;

alter table projects
  drop constraint if exists projects_project_kind_check,
  add constraint projects_project_kind_check check (project_kind in ('project', 'retainer'));

alter table projects
  drop constraint if exists projects_quoted_hours_check,
  add constraint projects_quoted_hours_check check (quoted_hours is null or quoted_hours >= 0);

alter table projects
  drop constraint if exists projects_monthly_hours_check,
  add constraint projects_monthly_hours_check check (monthly_hours is null or monthly_hours >= 0);

create table if not exists project_milestones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  label      text not null,
  weight     smallint not null default 10 check (weight >= 1),
  completed  boolean not null default false,
  "order"    integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists project_checklist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  label      text not null,
  completed  boolean not null default false,
  recurring  boolean not null default false,
  cycle_id   uuid,
  "order"    integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists project_activity (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  kind       text not null default 'update' check (kind in ('work', 'update')),
  note       text not null,
  hours      numeric(8, 2) not null default 0 check (hours >= 0),
  created_at timestamptz not null default now()
);

create table if not exists project_checklist_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  monthly    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists project_checklist_template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references project_checklist_templates(id) on delete cascade,
  label       text not null,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table project_milestones enable row level security;
alter table project_checklist_items enable row level security;
alter table project_activity enable row level security;
alter table project_checklist_templates enable row level security;
alter table project_checklist_template_items enable row level security;

create policy "project_milestones: user owns" on project_milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "project_checklist_items: user owns" on project_checklist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "project_activity: user owns" on project_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "project_checklist_templates: user owns" on project_checklist_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "project_checklist_template_items: via template" on project_checklist_template_items
  for all using (
    exists (
      select 1 from project_checklist_templates
      where project_checklist_templates.id = project_checklist_template_items.template_id
        and project_checklist_templates.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from project_checklist_templates
      where project_checklist_templates.id = project_checklist_template_items.template_id
        and project_checklist_templates.user_id = auth.uid()
    )
  );

create index if not exists projects_user_kind_status_activity_idx
  on projects (user_id, project_kind, status, last_activity_at desc);

create index if not exists project_milestones_project_order_idx
  on project_milestones (project_id, "order", created_at);

create index if not exists project_checklist_items_project_order_idx
  on project_checklist_items (project_id, "order", created_at);

create index if not exists project_activity_project_created_idx
  on project_activity (project_id, created_at desc);

create index if not exists project_checklist_template_items_template_order_idx
  on project_checklist_template_items (template_id, "order", created_at);
