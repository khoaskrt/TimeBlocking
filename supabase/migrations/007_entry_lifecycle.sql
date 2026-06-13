-- Entry lifecycle controls for projects and areas.

alter table areas
  add column if not exists status text not null default 'active';

alter table areas
  drop constraint if exists areas_status_check,
  add constraint areas_status_check check (status in ('active', 'done', 'deleted'));

create index if not exists areas_user_status_created_idx
  on areas (user_id, status, created_at);
