// Hand-written to match supabase/migrations/0001_init.sql. Once the user has
// a live Supabase project, this can be regenerated with:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

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
  user_id: string;
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
  user_id: string;
  day_type: DayType;
  created_at: string;
}

export type TemplateTaskRow = {
  id: string;
  template_id: string;
  user_id: string;
  kind: TaskKind;
  position: number;
  title: string;
  created_at: string;
}

export type TaskCompletionRow = {
  id: string;
  user_id: string;
  date: string;
  template_task_id: string;
  completed_at: string;
}

export type GoalRow = {
  id: string;
  user_id: string;
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
  user_id: string;
  date: string;
  prayer: PrayerName;
  status: PrayerStatus;
  prayed_at: string | null;
  created_at: string;
}

export type QadaMakeupRow = {
  id: string;
  user_id: string;
  prayer: PrayerName;
  made_up_at: string;
  source_prayer_log_id: string | null;
  created_at: string;
}

export type RetentionEventRow = {
  id: string;
  user_id: string;
  event_type: 'reset' | 'note';
  occurred_at: string;
  note: string | null;
  created_at: string;
}

export type SleepLogRow = {
  id: string;
  user_id: string;
  date: string;
  bed_time: string;
  wake_time: string;
  quality_rating: number | null;
  created_at: string;
}

export type WorkoutCycleSettingsRow = {
  id: string;
  user_id: string;
  cycle_start_date: string;
  created_at: string;
}

export type ExerciseCatalogRow = {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  created_at: string;
}

export type WorkoutSessionRow = {
  id: string;
  user_id: string;
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
  user_id: string;
  exercise_id: string;
  position: number;
  created_at: string;
}

export type WorkoutSetRow = {
  id: string;
  exercise_entry_id: string;
  user_id: string;
  set_number: number;
  reps: number;
  weight: number | null;
  weight_unit: WeightUnit;
  rpe: number | null;
  created_at: string;
}

export type WorkSessionRow = {
  id: string;
  user_id: string;
  date: string;
  started_at: string;
  ended_at: string | null;
  status: WorkSessionStatus;
  created_at: string;
}

export type WorkBreakRow = {
  id: string;
  work_session_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export type WorkEventRow = {
  id: string;
  user_id: string;
  work_session_id: string | null;
  date: string;
  event_type: WorkEventType;
  occurred_at: string;
  created_at: string;
}

export type WorkTargetsRow = {
  id: string;
  user_id: string;
  doors_target: number | null;
  interactions_target: number;
  pitches_target: number;
  appointments_target: number | null;
  updated_at: string;
}

export type WeeklyReviewRow = {
  id: string;
  user_id: string;
  week_start_date: string;
  reflection: string | null;
  completed_at: string | null;
  created_at: string;
}

export type WeeklyReviewGoalCheckinRow = {
  id: string;
  weekly_review_id: string;
  user_id: string;
  goal_id: string;
  progress_note: string | null;
  rating: number | null;
  created_at: string;
}

export type QuarterlyReviewRow = {
  id: string;
  user_id: string;
  cycle_start_date: string;
  cycle_end_date: string;
  reflection: string | null;
  completed_at: string | null;
  created_at: string;
}

type WithDefaults<Row, Defaulted extends keyof Row> = Omit<Row, Defaulted> &
  Partial<Pick<Row, Defaulted>>;

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        WithDefaults<
          ProfileRow,
          | 'timezone'
          | 'latitude'
          | 'longitude'
          | 'location_label'
          | 'prayer_calc_method'
          | 'prayer_madhab'
          | 'created_at'
          | 'updated_at'
        >,
        Partial<ProfileRow>
      >;
      notification_preferences: Table<
        NotificationPreferencesRow,
        WithDefaults<NotificationPreferencesRow, 'id' | 'updated_at'>,
        Partial<NotificationPreferencesRow>
      >;
      day_templates: Table<
        DayTemplateRow,
        WithDefaults<DayTemplateRow, 'id' | 'created_at'>,
        Partial<DayTemplateRow>
      >;
      template_tasks: Table<
        TemplateTaskRow,
        WithDefaults<TemplateTaskRow, 'id' | 'created_at'>,
        Partial<TemplateTaskRow>
      >;
      task_completions: Table<
        TaskCompletionRow,
        WithDefaults<TaskCompletionRow, 'id' | 'completed_at'>,
        Partial<TaskCompletionRow>
      >;
      goals: Table<
        GoalRow,
        WithDefaults<GoalRow, 'id' | 'status' | 'created_at' | 'updated_at'>,
        Partial<GoalRow>
      >;
      prayer_logs: Table<
        PrayerLogRow,
        WithDefaults<PrayerLogRow, 'id' | 'prayed_at' | 'created_at'>,
        Partial<PrayerLogRow>
      >;
      qada_makeups: Table<
        QadaMakeupRow,
        WithDefaults<QadaMakeupRow, 'id' | 'made_up_at' | 'source_prayer_log_id' | 'created_at'>,
        Partial<QadaMakeupRow>
      >;
      retention_events: Table<
        RetentionEventRow,
        WithDefaults<RetentionEventRow, 'id' | 'occurred_at' | 'note' | 'created_at'>,
        Partial<RetentionEventRow>
      >;
      sleep_logs: Table<
        SleepLogRow,
        WithDefaults<SleepLogRow, 'id' | 'quality_rating' | 'created_at'>,
        Partial<SleepLogRow>
      >;
      workout_cycle_settings: Table<
        WorkoutCycleSettingsRow,
        WithDefaults<WorkoutCycleSettingsRow, 'id' | 'created_at'>,
        Partial<WorkoutCycleSettingsRow>
      >;
      exercise_catalog: Table<
        ExerciseCatalogRow,
        WithDefaults<ExerciseCatalogRow, 'id' | 'muscle_group' | 'created_at'>,
        Partial<ExerciseCatalogRow>
      >;
      workout_sessions: Table<
        WorkoutSessionRow,
        WithDefaults<
          WorkoutSessionRow,
          'id' | 'started_at' | 'ended_at' | 'notes' | 'created_at'
        >,
        Partial<WorkoutSessionRow>
      >;
      workout_exercise_entries: Table<
        WorkoutExerciseEntryRow,
        WithDefaults<WorkoutExerciseEntryRow, 'id' | 'created_at'>,
        Partial<WorkoutExerciseEntryRow>
      >;
      workout_sets: Table<
        WorkoutSetRow,
        WithDefaults<WorkoutSetRow, 'id' | 'weight' | 'weight_unit' | 'rpe' | 'created_at'>,
        Partial<WorkoutSetRow>
      >;
      work_sessions: Table<
        WorkSessionRow,
        WithDefaults<WorkSessionRow, 'id' | 'started_at' | 'ended_at' | 'status' | 'created_at'>,
        Partial<WorkSessionRow>
      >;
      work_breaks: Table<
        WorkBreakRow,
        WithDefaults<WorkBreakRow, 'id' | 'started_at' | 'ended_at' | 'created_at'>,
        Partial<WorkBreakRow>
      >;
      work_events: Table<
        WorkEventRow,
        WithDefaults<WorkEventRow, 'id' | 'work_session_id' | 'occurred_at' | 'created_at'>,
        Partial<WorkEventRow>
      >;
      work_targets: Table<
        WorkTargetsRow,
        WithDefaults<
          WorkTargetsRow,
          | 'id'
          | 'doors_target'
          | 'interactions_target'
          | 'pitches_target'
          | 'appointments_target'
          | 'updated_at'
        >,
        Partial<WorkTargetsRow>
      >;
      weekly_reviews: Table<
        WeeklyReviewRow,
        WithDefaults<WeeklyReviewRow, 'id' | 'reflection' | 'completed_at' | 'created_at'>,
        Partial<WeeklyReviewRow>
      >;
      weekly_review_goal_checkins: Table<
        WeeklyReviewGoalCheckinRow,
        WithDefaults<
          WeeklyReviewGoalCheckinRow,
          'id' | 'progress_note' | 'rating' | 'created_at'
        >,
        Partial<WeeklyReviewGoalCheckinRow>
      >;
      quarterly_reviews: Table<
        QuarterlyReviewRow,
        WithDefaults<QuarterlyReviewRow, 'id' | 'reflection' | 'completed_at' | 'created_at'>,
        Partial<QuarterlyReviewRow>
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
