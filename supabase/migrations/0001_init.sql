-- LIFE app schema.
-- Every table (besides `profiles`, which is keyed by auth user id directly)
-- carries its own user_id column so row level security stays uniform:
-- `using (user_id = auth.uid())` everywhere, no cross-table joins needed for policies.

create extension if not exists "pgcrypto";

-- ============ Identity / settings ============

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  latitude double precision,
  longitude double precision,
  location_label text,
  prayer_calc_method text not null default 'MoonsightingCommittee',
  prayer_madhab text not null default 'shafi' check (prayer_madhab in ('shafi', 'hanafi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  prayer_enabled boolean not null default true,
  five45_morning_enabled boolean not null default true,
  five45_morning_time time not null default '06:00',
  work_reminders_enabled boolean not null default true,
  weekly_review_enabled boolean not null default true,
  quarterly_review_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ============ 545 system ============

create table public.day_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_type text not null check (day_type in ('standard', 'meeting', 'saturday', 'sunday')),
  created_at timestamptz not null default now(),
  unique (user_id, day_type)
);

create table public.template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.day_templates (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('wake', 'eod')),
  position smallint not null check (position between 1 and 5),
  title text not null,
  created_at timestamptz not null default now(),
  unique (template_id, kind, position)
);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  template_task_id uuid not null references public.template_tasks (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, date, template_task_id)
);
create index task_completions_user_date_idx on public.task_completions (user_id, date);

-- Goals are global per user (not per day-type) and surface on every day's 545.
-- Exactly 4 active goals at a time, one per slot.
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  slot smallint not null check (slot between 1 and 4),
  cycle_start_date date not null,
  cycle_end_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index goals_one_active_per_slot on public.goals (user_id, slot) where status = 'active';

-- ============ Prayer ============

create table public.prayer_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  prayer text not null check (prayer in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  status text not null check (status in ('on_time', 'late', 'qada', 'missed')),
  prayed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, date, prayer)
);

create table public.qada_makeups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prayer text not null check (prayer in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  made_up_at timestamptz not null default now(),
  source_prayer_log_id uuid references public.prayer_logs (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ Semen retention ============

create table public.retention_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in ('reset', 'note')),
  occurred_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);
create index retention_events_user_occurred_idx on public.retention_events (user_id, occurred_at desc);

-- ============ Sleep ============

create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  bed_time timestamptz not null,
  wake_time timestamptz not null,
  quality_rating smallint check (quality_rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ============ Workout ============
-- The 8-day split itself is a fixed constant in app code, not stored here;
-- cycle_start_date is the only thing needed to compute "today's" split day.

create table public.workout_cycle_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  cycle_start_date date not null,
  created_at timestamptz not null default now()
);

create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text,
  created_at timestamptz not null default now()
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  cycle_day smallint not null check (cycle_day between 1 and 8),
  split_label text not null,
  started_at timestamptz,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index workout_sessions_user_date_idx on public.workout_sessions (user_id, date);

create table public.workout_exercise_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog (id) on delete restrict,
  position smallint not null,
  created_at timestamptz not null default now()
);
create index workout_exercise_entries_session_idx on public.workout_exercise_entries (session_id);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_entry_id uuid not null references public.workout_exercise_entries (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  set_number smallint not null,
  reps int not null,
  weight numeric(6, 2),
  weight_unit text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  rpe smallint check (rpe between 1 and 10),
  created_at timestamptz not null default now()
);
create index workout_sets_exercise_entry_idx on public.workout_sets (exercise_entry_id);

-- ============ Work / sales ============

create table public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active' check (status in ('active', 'on_break', 'ended')),
  created_at timestamptz not null default now()
);
create index work_sessions_user_date_idx on public.work_sessions (user_id, date);

create table public.work_breaks (
  id uuid primary key default gen_random_uuid(),
  work_session_id uuid not null references public.work_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index work_breaks_session_idx on public.work_breaks (work_session_id);

-- Timestamped tap log (not per-day aggregates) so funnel analytics can be
-- computed over any window client-side.
create table public.work_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  work_session_id uuid references public.work_sessions (id) on delete set null,
  date date not null,
  event_type text not null check (event_type in ('door', 'interaction', 'pitch', 'appointment')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index work_events_user_date_idx on public.work_events (user_id, date);

create table public.work_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  doors_target int,
  interactions_target int not null default 20,
  pitches_target int not null default 8,
  appointments_target int,
  updated_at timestamptz not null default now()
);

-- ============ Reviews ============

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  reflection text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create table public.weekly_review_goal_checkins (
  id uuid primary key default gen_random_uuid(),
  weekly_review_id uuid not null references public.weekly_reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  progress_note text,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.quarterly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cycle_start_date date not null,
  cycle_end_date date not null,
  reflection text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ Row level security ============
-- Every table below has a user_id column: owner-only access.

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'notification_preferences',
      'day_templates', 'template_tasks', 'task_completions', 'goals',
      'prayer_logs', 'qada_makeups',
      'retention_events',
      'sleep_logs',
      'workout_cycle_settings', 'exercise_catalog', 'workout_sessions',
      'workout_exercise_entries', 'workout_sets',
      'work_sessions', 'work_breaks', 'work_events', 'work_targets',
      'weekly_reviews', 'weekly_review_goal_checkins', 'quarterly_reviews'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_owner', t
    );
  end loop;
end $$;

-- profiles is keyed by id (= auth user id) directly, not user_id
alter table public.profiles enable row level security;
create policy profiles_owner on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- ============ Housekeeping triggers ============

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();
create trigger work_targets_set_updated_at before update on public.work_targets
  for each row execute function public.set_updated_at();

-- Auto-create a profile row (and default settings) whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.notification_preferences (user_id) values (new.id);
  insert into public.work_targets (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
