-- Track when tasks are completed so Today can age completed Top 3 items out
-- after the day they were checked off.

alter table tasksc
  add column if not exists completed_at timestamptz;

update tasks
set completed_at = created_at
where status = 'done'
  and completed_at is null;

create index if not exists tasks_user_completed_at_idx
  on tasks (user_id, completed_at)
  where completed_at is not null;
