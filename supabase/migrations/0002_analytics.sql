-- Additive: persists a history of the daily score already computed client-side
-- (src/lib/score/todayScore.ts) so the Insights screen has real history to
-- show trends against instead of only ever seeing "today". Nothing in
-- 0001_init.sql is altered or dropped.

create table public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  score numeric(4, 3) not null check (score between 0 and 1),
  -- Per-component breakdown at the time of computation (key/score/weight/
  -- applicable), so a later formula change never has to guess how an old
  -- score was reached.
  components jsonb not null default '[]'::jsonb,
  -- Bumped whenever computeTodayScore's weighting rules change, so historical
  -- scores stay legible against the formula that actually produced them
  -- rather than being silently reinterpreted.
  formula_version smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create trigger daily_scores_set_updated_at before update on public.daily_scores
  for each row execute function public.set_updated_at();

alter table public.daily_scores enable row level security;
create policy daily_scores_owner on public.daily_scores
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index daily_scores_user_date_idx on public.daily_scores (user_id, date desc);
