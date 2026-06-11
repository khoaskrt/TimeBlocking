-- ============================================================
-- Tasks UI persistence fields
-- ============================================================

alter table areas
  add column if not exists key text;

update areas
set key = case lower(name)
  when 'work' then 'work'
  when 'personal' then 'personal'
  when 'family' then 'family'
  when 'health' then 'health'
  else key
end
where key is null;

create unique index if not exists areas_user_key_unique
  on areas (user_id, key);

alter table tasks
  add column if not exists notes text not null default '',
  add column if not exists due_time time,
  add column if not exists repeat text not null default '',
  add column if not exists reminder text,
  add column if not exists note_id uuid references notes(id) on delete set null;

alter table tasks
  alter column priority drop default;

alter table tasks
  drop constraint if exists tasks_priority_check;

alter table tasks
  alter column priority type smallint using (
    case priority
      when 'high' then 2
      when 'medium' then 3
      when 'low' then 4
      else nullif(priority, '')::smallint
    end
  );

alter table tasks
  alter column priority set default 4,
  alter column priority set not null,
  add constraint tasks_priority_check check (priority between 1 and 4);
