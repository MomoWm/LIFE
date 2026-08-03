import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { supabase } from '@/lib/supabase/client';
import { cycleDayFor } from '@/lib/workout/cycle';
import { splitForDay } from '@/lib/workout/split';
import type {
  ExerciseCatalogRow,
  WorkoutCycleSettingsRow,
  WorkoutSessionRow,
  WorkoutSetRow,
} from '@/lib/supabase/types';
import { useUserId } from '@/hooks/use-five45';

const DEFAULT_EXERCISES: { name: string; muscle_group: string }[] = [
  { name: 'Bench Press', muscle_group: 'chest' },
  { name: 'Incline DB Press', muscle_group: 'chest' },
  { name: 'Cable Fly', muscle_group: 'chest' },
  { name: 'Overhead Press', muscle_group: 'shoulders' },
  { name: 'Lateral Raise', muscle_group: 'shoulders' },
  { name: 'Rear Delt Fly', muscle_group: 'shoulders' },
  { name: 'Cable Pushdown', muscle_group: 'triceps' },
  { name: 'Skullcrusher', muscle_group: 'triceps' },
  { name: 'Overhead Extension', muscle_group: 'triceps' },
  { name: 'Pull-Up', muscle_group: 'back' },
  { name: 'Barbell Row', muscle_group: 'back' },
  { name: 'Lat Pulldown', muscle_group: 'back' },
  { name: 'Deadlift', muscle_group: 'back' },
  { name: 'Barbell Curl', muscle_group: 'biceps' },
  { name: 'Hammer Curl', muscle_group: 'biceps' },
  { name: 'Incline DB Curl', muscle_group: 'biceps' },
  { name: 'Squat', muscle_group: 'legs' },
  { name: 'Leg Press', muscle_group: 'legs' },
  { name: 'Romanian Deadlift', muscle_group: 'legs' },
  { name: 'Leg Curl', muscle_group: 'legs' },
  { name: 'Calf Raise', muscle_group: 'legs' },
];

export function useWorkoutCycle() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.workoutCycle(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_cycle_settings')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return (data as WorkoutCycleSettingsRow | null) ?? null;
    },
    enabled: !!userId,
  });
}

export function useSetCycleStart() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cycleStartIso: string) => {
      const { error } = await supabase
        .from('workout_cycle_settings')
        .upsert({ user_id: userId, cycle_start_date: cycleStartIso }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workoutCycle(userId) });
      queryClient.invalidateQueries({ queryKey: ['workout', 'today'] });
    },
  });
}

/** Seeds a starter catalog on first use, then returns it grouped by muscle. */
export function useExerciseCatalog() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.exerciseCatalog(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_catalog')
        .select()
        .eq('user_id', userId)
        .order('name');
      if (error) throw error;
      if ((data as ExerciseCatalogRow[]).length > 0) return data as ExerciseCatalogRow[];

      const { data: seeded, error: seedError } = await supabase
        .from('exercise_catalog')
        .insert(DEFAULT_EXERCISES.map((e) => ({ ...e, user_id: userId })))
        .select();
      if (seedError) throw seedError;
      return seeded as ExerciseCatalogRow[];
    },
    enabled: !!userId,
  });
}

export type SessionSet = WorkoutSetRow;

export type SessionEntry = {
  id: string;
  position: number;
  exercise: ExerciseCatalogRow;
  sets: SessionSet[];
};

export type TodayWorkout = {
  cycleDay: number | null;
  session: (WorkoutSessionRow & { entries: SessionEntry[] }) | null;
};

type RawEntry = {
  id: string;
  position: number;
  exercise_catalog: ExerciseCatalogRow;
  workout_sets: WorkoutSetRow[];
};

export function useWorkoutToday() {
  const userId = useUserId();
  const date = todayIso();

  return useQuery({
    queryKey: queryKeys.workoutToday(userId, date),
    queryFn: async (): Promise<TodayWorkout> => {
      const { data: settings, error: settingsError } = await supabase
        .from('workout_cycle_settings')
        .select()
        .eq('user_id', userId)
        .maybeSingle();
      if (settingsError) throw settingsError;

      const cycleDay = settings
        ? cycleDayFor(date, (settings as WorkoutCycleSettingsRow).cycle_start_date)
        : null;

      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*, workout_exercise_entries(id, position, exercise_catalog(*), workout_sets(*))')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle();
      if (sessionError) throw sessionError;

      if (!session) return { cycleDay, session: null };

      const raw = session as unknown as WorkoutSessionRow & {
        workout_exercise_entries: RawEntry[];
      };
      return {
        cycleDay,
        session: {
          ...raw,
          entries: raw.workout_exercise_entries
            .map((entry) => ({
              id: entry.id,
              position: entry.position,
              exercise: entry.exercise_catalog,
              sets: [...entry.workout_sets].sort((a, b) => a.set_number - b.set_number),
            }))
            .sort((a, b) => a.position - b.position),
        },
      };
    },
    enabled: !!userId,
  });
}

function useInvalidateWorkout() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const date = todayIso();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workoutToday(userId, date) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workoutHistory(userId) });
  };
}

export function useStartSession() {
  const userId = useUserId();
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (input: { cycleDay: number }) => {
      const split = splitForDay(input.cycleDay);
      const { error } = await supabase.from('workout_sessions').insert({
        user_id: userId,
        date: todayIso(),
        cycle_day: input.cycleDay,
        split_label: split.label,
        started_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSettled: invalidate,
  });
}

export function useAddExerciseEntry() {
  const userId = useUserId();
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (input: { sessionId: string; exerciseId: string; position: number }) => {
      const { error } = await supabase.from('workout_exercise_entries').insert({
        session_id: input.sessionId,
        user_id: userId,
        exercise_id: input.exerciseId,
        position: input.position,
      });
      if (error) throw error;
    },
    onSettled: invalidate,
  });
}

export function useAddSet() {
  const userId = useUserId();
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (input: {
      entryId: string;
      setNumber: number;
      reps: number;
      weight: number | null;
    }) => {
      const { error } = await supabase.from('workout_sets').insert({
        exercise_entry_id: input.entryId,
        user_id: userId,
        set_number: input.setNumber,
        reps: input.reps,
        weight: input.weight,
      });
      if (error) throw error;
    },
    onSettled: invalidate,
  });
}

export function useEndSession() {
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSettled: invalidate,
  });
}

export function useWorkoutHistory() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.workoutHistory(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*, workout_exercise_entries(id, workout_sets(id))')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (
        data as unknown as (WorkoutSessionRow & {
          workout_exercise_entries: { id: string; workout_sets: { id: string }[] }[];
        })[]
      ).map((session) => ({
        ...session,
        exerciseCount: session.workout_exercise_entries.length,
        setCount: session.workout_exercise_entries.reduce(
          (sum, entry) => sum + entry.workout_sets.length,
          0
        ),
      }));
    },
    enabled: !!userId,
  });
}

export type ExercisePoint = { date: string; topWeight: number };

export function useExerciseProgress(exerciseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.exerciseProgress(userId, exerciseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_exercise_entries')
        .select('exercise_catalog(name), workout_sets(weight), workout_sessions(date)')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId);
      if (error) throw error;

      const rows = data as unknown as {
        exercise_catalog: { name: string };
        workout_sets: { weight: number | null }[];
        workout_sessions: { date: string };
      }[];

      const byDate = new Map<string, number>();
      for (const row of rows) {
        const top = Math.max(0, ...row.workout_sets.map((s) => s.weight ?? 0));
        const date = row.workout_sessions.date;
        byDate.set(date, Math.max(byDate.get(date) ?? 0, top));
      }

      const points: ExercisePoint[] = [...byDate.entries()]
        .map(([date, topWeight]) => ({ date, topWeight }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return { name: rows[0]?.exercise_catalog.name ?? 'Exercise', points };
    },
    enabled: !!userId && !!exerciseId,
  });
}
