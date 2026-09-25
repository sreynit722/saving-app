create table if not exists public.goals (
  id text primary key,
  name text not null,
  theme text not null check (theme in ('sunset', 'ocean', 'forest', 'lavender')),
  target numeric not null check (target > 0),
  saved numeric not null default 0 check (saved >= 0),
  cadence text not null check (cadence in ('week', 'month')),
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  goal_id text not null references public.goals(id) on delete cascade,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;
alter table public.deposits enable row level security;

drop policy if exists "public can read goals" on public.goals;
drop policy if exists "public can create goals" on public.goals;
drop policy if exists "public can update goals" on public.goals;
drop policy if exists "public can read deposits" on public.deposits;
drop policy if exists "public can create deposits" on public.deposits;

create policy "public can read goals" on public.goals for select to anon using (true);
create policy "public can create goals" on public.goals for insert to anon with check (true);
create policy "public can update goals" on public.goals for update to anon using (true) with check (true);
create policy "public can read deposits" on public.deposits for select to anon using (true);
create policy "public can create deposits" on public.deposits for insert to anon with check (true);