import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, parseISO } from 'date-fns';

import { todayIso } from '@/lib/dates';
import { resolveDayType, type DayType } from '@/lib/dayType/dayType';
import { queryKeys } from '@/lib/query/keys';
import { computeDailyCompletionStreak } from '@/lib/streaks/streaks';
import { supabase } from '@/lib/supabase/client';
import type { GoalRow, TaskCompletionRow, TemplateTaskRow } from '@/lib/supabase/types';
import { useAuth } from '@/hooks/use-auth';

export function useUserId(): string {
  const { session } = useAuth();
  // Screens using this hook are behind the auth gate; empty string only occurs
  // in a transient signed-out render and produces no queries (enabled: false).
  return session?.user.id ?? '';
}

async function fetchTemplateWithTasks(userId: string, dayType: DayType) {
  const { data: template, error } = await supabase
    .from('day_templates')
    .upsert({ user_id: userId, day_type: dayType }, { onConflict: 'user_id,day_type' })
    .select()
    .single();
  if (error) throw error;

  const { data: tasks, error: tasksError } = await supabase
    .from('template_tasks')
    .select()
    .eq('template_id', template.id)
    .order('kind')
    .order('position');
  if (tasksError) throw tasksError;

  return { template, tasks: tasks as TemplateTaskRow[] };
}

export function useDayTemplate(dayType: DayType) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.five45Template(userId, dayType),
    queryFn: () => fetchTemplateWithTasks(userId, dayType),
    enabled: !!userId,
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
      const { template } = await fetchTemplateWithTasks(userId, input.dayType);
      const trimmed = input.title.trim();
      if (!trimmed) {
        const { error } = await supabase
          .from('template_tasks')
          .delete()
          .eq('template_id', template.id)
          .eq('kind', input.kind)
          .eq('position', input.position);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('template_tasks').upsert(
        {
          template_id: template.id,
          user_id: userId,
          kind: input.kind,
          position: input.position,
          title: trimmed,
        },
        { onConflict: 'template_id,kind,position' }
      );
      if (error) throw error;
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
      const { tasks } = await fetchTemplateWithTasks(userId, dayType);
      const { data: completions, error } = await supabase
        .from('task_completions')
        .select()
        .eq('user_id', userId)
        .eq('date', date);
      if (error) throw error;
      return {
        dayType,
        tasks,
        completions: completions as TaskCompletionRow[],
        completedTaskIds: new Set((completions as TaskCompletionRow[]).map((c) => c.template_task_id)),
      };
    },
    enabled: !!userId,
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
        const { error } = await supabase
          .from('task_completions')
          .delete()
          .eq('user_id', userId)
          .eq('date', date)
          .eq('template_task_id', input.taskId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('task_completions')
          .insert({ user_id: userId, date, template_task_id: input.taskId });
        if (error) throw error;
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

      const [templatesRes, completionsRes] = await Promise.all([
        supabase.from('template_tasks').select('id, template_id, day_templates!inner(day_type)').eq('user_id', userId),
        supabase
          .from('task_completions')
          .select('date, template_task_id')
          .eq('user_id', userId)
          .gte('date', from),
      ]);
      if (templatesRes.error) throw templatesRes.error;
      if (completionsRes.error) throw completionsRes.error;

      const taskIdsByDayType = new Map<string, Set<string>>();
      for (const row of templatesRes.data as unknown as {
        id: string;
        day_templates: { day_type: DayType };
      }[]) {
        const dayType = row.day_templates.day_type;
        if (!taskIdsByDayType.has(dayType)) taskIdsByDayType.set(dayType, new Set());
        taskIdsByDayType.get(dayType)!.add(row.id);
      }

      const completedByDate = new Map<string, Set<string>>();
      for (const row of completionsRes.data as { date: string; template_task_id: string }[]) {
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
    enabled: !!userId,
  });
}

const CYCLE_LENGTH_DAYS = 91; // 13 weeks

export function useActiveGoals() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.goals(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select()
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('slot');
      if (error) throw error;
      return data as GoalRow[];
    },
    enabled: !!userId,
  });
}

export function useSaveGoal() {
  const userId = useUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { slot: number; title: string; description?: string }) => {
      const { data: actives, error: activesError } = await supabase
        .from('goals')
        .select()
        .eq('user_id', userId)
        .eq('status', 'active');
      if (activesError) throw activesError;

      const existing = (actives as GoalRow[]).find((g) => g.slot === input.slot);
      const trimmed = input.title.trim();

      if (existing) {
        if (!trimmed) {
          const { error } = await supabase
            .from('goals')
            .update({ status: 'abandoned' })
            .eq('id', existing.id);
          if (error) throw error;
          return;
        }
        const { error } = await supabase
          .from('goals')
          .update({ title: trimmed, description: input.description?.trim() || null })
          .eq('id', existing.id);
        if (error) throw error;
        return;
      }

      if (!trimmed) return;

      // New goals join the cycle of existing active goals, or start a fresh one.
      const anchor = (actives as GoalRow[])[0];
      const cycleStart = anchor?.cycle_start_date ?? todayIso();
      const cycleEnd =
        anchor?.cycle_end_date ??
        format(addDays(parseISO(cycleStart), CYCLE_LENGTH_DAYS), 'yyyy-MM-dd');

      const { error } = await supabase.from('goals').insert({
        user_id: userId,
        slot: input.slot,
        title: trimmed,
        description: input.description?.trim() || null,
        cycle_start_date: cycleStart,
        cycle_end_date: cycleEnd,
      });
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals(userId) });
    },
  });
}
