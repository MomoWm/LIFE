import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { table } from '@/lib/db/local-table';
import { todayIso } from '@/lib/dates';
import { queryKeys } from '@/lib/query/keys';
import { cycleDayFor } from '@/lib/workout/cycle';
import { splitForDay } from '@/lib/workout/split';
import type {
  ExerciseCatalogRow,
  WorkoutCycleSettingsRow,
  WorkoutExerciseEntryRow,
  WorkoutSessionRow,
  WorkoutSetRow,
} from '@/lib/db/types';
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

const cycleSettings = table<WorkoutCycleSettingsRow>('workout_cycle_settings');
const exerciseCatalog = table<ExerciseCatalogRow>('exercise_catalog');
const workoutSessions = table<WorkoutSessionRow>('workout_sessions');
const exerciseEntries = table<WorkoutExerciseEntryRow>('workout_exercise_entries');
const workoutSets = table<WorkoutSetRow>('workout_sets');

export function useWorkoutCycle() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.workoutCycle(userId),
    queryFn: async () => (await cycleSettings.select())[0] ?? null,
  });
}

export function useSetCycleStart() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cycleStartIso: string) => {
      await cycleSettings.upsert(() => true, { cycle_start_date: cycleStartIso });
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
      const existing = await exerciseCatalog.select();
      if (existing.length > 0) return existing.slice().sort((a, b) => a.name.localeCompare(b.name));
      const seeded = await Promise.all(
        DEFAULT_EXERCISES.map((e) => exerciseCatalog.insert(e))
      );
      return seeded.sort((a, b) => a.name.localeCompare(b.name));
    },
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

/** Joins a session row up into its entries and sets, from the local tables. */
async function hydrateSession(
  session: WorkoutSessionRow
): Promise<WorkoutSessionRow & { entries: SessionEntry[] }> {
  const [entries, catalog, sets] = await Promise.all([
    exerciseEntries.select((e) => e.session_id === session.id),
    exerciseCatalog.select(),
    workoutSets.select(),
  ]);
  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const entryIds = new Set(entries.map((e) => e.id));

  return {
    ...session,
    entries: entries
      .map((entry) => ({
        id: entry.id,
        position: entry.position,
        exercise: catalogById.get(entry.exercise_id),
        sets: sets
          .filter((s) => s.exercise_entry_id === entry.id && entryIds.has(entry.id))
          .sort((a, b) => a.set_number - b.set_number),
      }))
      // A catalog row that vanished (corrupt/edited-out) must drop its entry
      // rather than render with an undefined exercise and crash the screen.
      .filter((e): e is SessionEntry => !!e.exercise)
      .sort((a, b) => a.position - b.position),
  };
}

export function useWorkoutToday() {
  const userId = useUserId();
  const date = todayIso();

  return useQuery({
    queryKey: queryKeys.workoutToday(userId, date),
    queryFn: async (): Promise<TodayWorkout> => {
      const settings = (await cycleSettings.select())[0] ?? null;
      const cycleDay = settings ? cycleDayFor(date, settings.cycle_start_date) : null;

      const session = (await workoutSessions.select((s) => s.date === date))[0] ?? null;
      if (!session) return { cycleDay, session: null };

      return { cycleDay, session: await hydrateSession(session) };
    },
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
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (input: { cycleDay: number }) => {
      const split = splitForDay(input.cycleDay);
      await workoutSessions.insert({
        date: todayIso(),
        cycle_day: input.cycleDay,
        split_label: split.label,
        started_at: new Date().toISOString(),
        ended_at: null,
        notes: null,
      });
    },
    onSettled: invalidate,
  });
}

export function useAddExerciseEntry() {
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (input: { sessionId: string; exerciseId: string; position: number }) => {
      await exerciseEntries.insert({
        session_id: input.sessionId,
        exercise_id: input.exerciseId,
        position: input.position,
      });
    },
    onSettled: invalidate,
  });
}

export function useAddSet() {
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (input: {
      entryId: string;
      setNumber: number;
      reps: number;
      weight: number | null;
    }) => {
      await workoutSets.insert({
        exercise_entry_id: input.entryId,
        set_number: input.setNumber,
        reps: input.reps,
        weight: input.weight,
        weight_unit: 'lb',
        rpe: null,
      });
    },
    onSettled: invalidate,
  });
}

export function useEndSession() {
  const invalidate = useInvalidateWorkout();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await workoutSessions.update(sessionId, { ended_at: new Date().toISOString() });
    },
    onSettled: invalidate,
  });
}

export function useWorkoutHistory() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.workoutHistory(userId),
    queryFn: async () => {
      const [sessions, entries, sets] = await Promise.all([
        workoutSessions.select(),
        exerciseEntries.select(),
        workoutSets.select(),
      ]);
      const sorted = sessions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

      return sorted.map((session) => {
        const sessionEntryIds = new Set(
          entries.filter((e) => e.session_id === session.id).map((e) => e.id)
        );
        return {
          ...session,
          exerciseCount: sessionEntryIds.size,
          setCount: sets.filter((s) => sessionEntryIds.has(s.exercise_entry_id)).length,
        };
      });
    },
  });
}

export type ExercisePoint = { date: string; topWeight: number };

export function useExerciseProgress(exerciseId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.exerciseProgress(userId, exerciseId),
    queryFn: async () => {
      const [catalog, entries, sets, sessions] = await Promise.all([
        exerciseCatalog.select(),
        exerciseEntries.select((e) => e.exercise_id === exerciseId),
        workoutSets.select(),
        workoutSessions.select(),
      ]);
      const exercise = catalog.find((c) => c.id === exerciseId);
      const sessionById = new Map(sessions.map((s) => [s.id, s]));

      const byDate = new Map<string, number>();
      for (const entry of entries) {
        const session = sessionById.get(entry.session_id);
        if (!session) continue;
        const top = Math.max(
          0,
          ...sets.filter((s) => s.exercise_entry_id === entry.id).map((s) => s.weight ?? 0)
        );
        byDate.set(session.date, Math.max(byDate.get(session.date) ?? 0, top));
      }

      const points: ExercisePoint[] = [...byDate.entries()]
        .map(([date, topWeight]) => ({ date, topWeight }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return { name: exercise?.name ?? 'Exercise', points };
    },
    enabled: !!exerciseId,
  });
}
