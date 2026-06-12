-- Navigation-critical dashboard query indexes.

create index if not exists tasks_user_created_at_idx
  on tasks (user_id, created_at desc);

create index if not exists tasks_user_status_created_at_idx
  on tasks (user_id, status, created_at desc);

create index if not exists tasks_user_due_date_created_at_idx
  on tasks (user_id, due_date, created_at desc);

create index if not exists projects_user_last_activity_at_idx
  on projects (user_id, last_activity_at desc);

create index if not exists routine_logs_user_routine_date_idx
  on routine_logs (user_id, routine_id, date);
