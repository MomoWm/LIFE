// Row shapes for every local table. These used to describe a Supabase
// Postgres schema; LIFE is local-first now, so they describe the JSON arrays
// `src/lib/db/local-table.ts` reads and writes under AsyncStorage instead —
// same fields, same names, no server behind them.

export type DayType = 'standard' | 'meeting' | 'saturday' | 'sunday';
export type TaskKind = 'wake' | 'eod';
export type GoalStatus = 'active' | 'completed' | 'abandoned';
export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type PrayerStatus = 'on_time' | 'late' | 'qada' | 'missed';
export type WeightUnit = 'lb' | 'kg';
export type WorkSessionStatus = 'active' | 'on_break' | 'ended';
export type WorkEventType = 'door' | 'interaction' | 'pitch' | 'appointment';

export type ProfileRow = {
  id: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  prayer_calc_method: string;
  prayer_madhab: 'shafi' | 'hanafi';
  created_at: string;
  updated_at: string;
}

export type NotificationPreferencesRow = {
  id: string;
  prayer_enabled: boolean;
  five45_morning_enabled: boolean;
  five45_morning_time: string;
  work_reminders_enabled: boolean;
  weekly_review_enabled: boolean;
  quarterly_review_enabled: boolean;
  updated_at: string;
}

export type DayTemplateRow = {
  id: string;
  day_type: DayType;
  created_at: string;
}

export type TemplateTaskRow = {
  id: string;
  template_id: string;
  kind: TaskKind;
  position: number;
  title: string;
  created_at: string;
}

export type TaskCompletionRow = {
  id: string;
  date: string;
  template_task_id: string;
  completed_at: string;
}

export type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  slot: number;
  cycle_start_date: string;
  cycle_end_date: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export type PrayerLogRow = {
  id: string;
  date: string;
  prayer: PrayerName;
  status: PrayerStatus;
  prayed_at: string | null;
  created_at: string;
}

export type QadaMakeupRow = {
  id: string;
  prayer: PrayerName;
  made_up_at: string;
  source_prayer_log_id: string | null;
  created_at: string;
}

export type RetentionEventRow = {
  id: string;
  event_type: 'reset' | 'note';
  occurred_at: string;
  note: string | null;
  created_at: string;
}

export type SleepLogRow = {
  id: string;
  date: string;
  bed_time: string;
  wake_time: string;
  quality_rating: number | null;
  created_at: string;
}

export type DailyScoreRow = {
  id: string;
  date: string;
  score: number;
  components: { key: string; score: number; weight: number; applicable: boolean }[];
  formula_version: number;
  created_at: string;
  updated_at: string;
}

export type WorkoutCycleSettingsRow = {
  id: string;
  cycle_start_date: string;
  created_at: string;
}

export type ExerciseCatalogRow = {
  id: string;
  name: string;
  muscle_group: string | null;
  created_at: string;
}

export type WorkoutSessionRow = {
  id: string;
  date: string;
  cycle_day: number;
  split_label: string;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export type WorkoutExerciseEntryRow = {
  id: string;
  session_id: string;
  exercise_id: string;
  position: number;
  created_at: string;
}

export type WorkoutSetRow = {
  id: string;
  exercise_entry_id: string;
  set_number: number;
  reps: number;
  weight: number | null;
  weight_unit: WeightUnit;
  rpe: number | null;
  created_at: string;
}

export type WorkSessionRow = {
  id: string;
  date: string;
  started_at: string;
  ended_at: string | null;
  status: WorkSessionStatus;
  created_at: string;
}

export type WorkBreakRow = {
  id: string;
  work_session_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export type WorkEventRow = {
  id: string;
  work_session_id: string | null;
  date: string;
  event_type: WorkEventType;
  occurred_at: string;
  created_at: string;
}

export type WorkTargetsRow = {
  id: string;
  doors_target: number | null;
  interactions_target: number;
  pitches_target: number;
  appointments_target: number | null;
  updated_at: string;
}

export type WeeklyReviewRow = {
  id: string;
  week_start_date: string;
  reflection: string | null;
  completed_at: string | null;
  created_at: string;
}

export type WeeklyReviewGoalCheckinRow = {
  id: string;
  weekly_review_id: string;
  goal_id: string;
  progress_note: string | null;
  rating: number | null;
  created_at: string;
}

export type QuarterlyReviewRow = {
  id: string;
  cycle_start_date: string;
  cycle_end_date: string;
  reflection: string | null;
  completed_at: string | null;
  created_at: string;
}
