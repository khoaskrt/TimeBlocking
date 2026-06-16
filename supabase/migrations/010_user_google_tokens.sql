create table if not exists user_google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz default now()
);

alter table user_google_tokens enable row level security;

create policy "Users can read own tokens"
  on user_google_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own tokens"
  on user_google_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tokens"
  on user_google_tokens for update
  using (auth.uid() = user_id);
