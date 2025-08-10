-- Create a simple students table keyed to auth.users
create table if not exists public.students (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  active boolean not null default true,
  created_at timestamp with time zone default now()
);

alter table public.students enable row level security;

-- Policy: a signed-in user can select only their own row (optional)
create policy if not exists "Users can read own student row"
  on public.students for select
  using (auth.uid() = user_id);

-- Inserts/updates/deletes should be performed by the server using the service role.
-- (service_role bypasses RLS).

-- Helpful index
create index if not exists idx_students_email on public.students (email);

-- Example: seed a row (replace the UUID/email after creating users in Auth)
-- insert into public.students (user_id, email, full_name, active)
-- values ('00000000-0000-0000-0000-000000000000', 'student@example.com', 'Student Name', true)
-- on conflict (user_id) do update set email=excluded.email, full_name=excluded.full_name, active=excluded.active;
