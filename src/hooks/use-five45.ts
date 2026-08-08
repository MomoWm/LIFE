import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { table } from '@/lib/db/local-table';
import { todayIso } from '@/lib/dates';
import { resolveDayType, type DayType } from '@/lib/dayType/dayType';
import { queryKeys } from '@/lib/query/keys';
import { computeDailyCompletionStreak } from '@/lib/streaks/streaks';
import type { GoalRow, TaskCompletionRow, TemplateTaskRow } from '@/lib/db/types';

/**
 * Fixed local identity. LIFE moved off Supabase to on-device storage — there
 * is no account, no network, one installation. `userId` stays threaded
 * through every query key and hook signature below instead of being ripped
 * out, because the alternative was restructuring every key in
 * `src/lib/query/keys.ts` and every call site across ten hook files for no
 * behavioural gain: a constant costs nothing and keeps this change to "what
 * a hook reads from," not "what shape a hook is."
 */
export function useUserId(): string {
  return 'local';
}

type DayTemplateRow = { id: string; day_type: DayType; created_at: string };

const templates = table<DayTemplateRow>('day_templates');
const templateTasks = table<TemplateTaskRow>('template_tasks');
const taskCompletions = table<TaskCompletionRow>('task_completions');
const goalsTable = table<GoalRow>('goals');

async function fetchTemplateWithTasks(dayType: DayType) {
  const template = await templates.upsert((t) => t.day_type === dayType, { day_type: dayType });
  const tasks = (await templateTasks.select((t) => t.template_id === template.id)).sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.position - b.position
  );
  return { template, tasks };
}

export function useDayTemplate(dayType: DayType) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.five45Template(userId, dayType),
    queryFn: () => fetchTemplateWithTasks(dayType),
  });
}

export function useSaveTemplateTask() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      dayType: DayType;
      kind: 'wake' | 'eod';
      position: number;
      title: string;
    }) => {
      const { template } = await fetchTemplateWithTasks(input.dayType);
      const trimmed = input.title.trim();
      const isSlot = (t: TemplateTaskRow) =>
        t.template_id === template.id && t.kind === input.kind && t.position === input.position;

      if (!trimmed) {
        await templateTasks.deleteWhere(isSlot);
        return;
      }
      await templateTasks.upsert(isSlot, {
        template_id: template.id,
        kind: input.kind,
        position: input.position,
        title: trimmed,
      });
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.five45Template(userId, input.dayType) });
      queryClient.invalidateQueries({ queryKey: ['five45', 'today'] });
    },
  });
}

export type Five45Today = {
  dayType: DayType;
  tasks: TemplateTaskRow[];
  completions: TaskCompletionRow[];
  completedTaskIds: Set<string>;
};

export function useFive45Today() {
  const userId = useUserId();
  const date = todayIso();
  const dayType = resolveDayType(new Date());

  return useQuery({
    queryKey: queryKeys.five45Today(userId, date),
    queryFn: async (): Promise<Five45Today> => {
      const { tasks } = await fetchTemplateWithTasks(dayType);
      const completions = await taskCompletions.select((c) => c.date === date);
      return {
        dayType,
        tasks,
        completions,
        completedTaskIds: new Set(completions.map((c) => c.template_task_id)),
      };
    },
  });
}

export function useToggleTask() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const date = todayIso();
  const key = queryKeys.five45Today(userId, date);

  return useMutation({
    mutationFn: async (input: { taskId: string; completed: boolean }) => {
      if (input.completed) {
        await taskCompletions.deleteWhere(
          (c) => c.date === date && c.template_task_id === input.taskId
        );
      } else {
        await taskCompletions.insert({
          date,
          template_task_id: input.taskId,
          completed_at: new Date().toISOString(),
        });
      }
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Five45Today>(key);
      if (previous) {
        const next = new Set(previous.completedTaskIds);
        if (input.completed) {
          next.delete(input.taskId);
        } else {
          next.add(input.taskId);
        }
        queryClient.setQueryData<Five45Today>(key, { ...previous, completedTaskIds: next });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: queryKeys.five45History(userId) });
    },
  });
}

const STREAK_LOOKBACK_DAYS = 90;

/**
 * Streak of days where every task in that day's template was completed.
 * Judged against the *current* templates — editing a template rewrites history's
 * meaning, which is acceptable for a personal habit app.
 */
export function useFive45Streak() {
  const userId = useUserId();

  return useQuery({
    queryKey: queryKeys.five45History(userId),
    queryFn: async () => {
      const today = todayIso();
      const from = format(addDays(parseISO(today), -STREAK_LOOKBACK_DAYS), 'yyyy-MM-dd');

      const [allTemplates, allTasks, completions] = await Promise.all([
        templates.select(),
        templateTasks.select(),
        taskCompletions.select((c) => c.date >= from),
      ]);
      const dayTypeByTemplateId = new Map(allTemplates.map((t) => [t.id, t.day_type]));

      const taskIdsByDayType = new Map<string, Set<string>>();
      for (const row of allTasks) {
        const dayType = dayTypeByTemplateId.get(row.template_id);
        if (!dayType) continue;
        if (!taskIdsByDayType.has(dayType)) taskIdsByDayType.set(dayType, new Set());
        taskIdsByDayType.get(dayType)!.add(row.id);
      }

      const completedByDate = new Map<string, Set<string>>();
      for (const row of completions) {
        if (!completedByDate.has(row.date)) completedByDate.set(row.date, new Set());
        completedByDate.get(row.date)!.add(row.template_task_id);
      }

      const fullyCompletedDates = new Set<string>();
      for (const [date, doneIds] of completedByDate) {
        const dayType = resolveDayType(parseISO(date));
        const required = taskIdsByDayType.get(dayType);
        if (required && required.size > 0 && [...required].every((id) => doneIds.has(id))) {
          fullyCompletedDates.add(date);
        }
      }

      return computeDailyCompletionStreak(fullyCompletedDates, today);
    },
  });
}

const CYCLE_LENGTH_DAYS = 91; // 13 weeks

export function useActiveGoals() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.goals(userId),
    queryFn: async () => {
      const rows = await goalsTable.select((g) => g.status === 'active');
      return rows.slice().sort((a, b) => a.slot - b.slot);
    },
  });
}

export function useSaveGoal() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { slot: number; title: string; description?: string }) => {
      const actives = await goalsTable.select((g) => g.status === 'active');
      const existing = actives.find((g) => g.slot === input.slot);
      const trimmed = input.title.trim();

      if (existing) {
        if (!trimmed) {
          await goalsTable.update(existing.id, { status: 'abandoned' });
          return;
        }
        await goalsTable.update(existing.id, {
          title: trimmed,
          description: input.description?.trim() || null,
        });
        return;
      }

      if (!trimmed) return;

      // New goals join the cycle of existing active goals, or start a fresh one.
      const anchor = actives[0];
      const cycleStart = anchor?.cycle_start_date ?? todayIso();
      const cycleEnd =
        anchor?.cycle_end_date ??
        format(addDays(parseISO(cycleStart), CYCLE_LENGTH_DAYS), 'yyyy-MM-dd');

      await goalsTable.insert({
        slot: input.slot,
        title: trimmed,
        description: input.description?.trim() || null,
        status: 'active',
        cycle_start_date: cycleStart,
        cycle_end_date: cycleEnd,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) });
    },
  });
}
