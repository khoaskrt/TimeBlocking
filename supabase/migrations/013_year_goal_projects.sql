-- ============================================================
-- Link year goals to active projects
-- ============================================================

alter table year_goals
  add column if not exists project_id uuid references projects(id) on delete set null;

create index if not exists year_goals_user_project_idx
  on year_goals (user_id, project_id);
