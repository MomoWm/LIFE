export type SplitDay = {
  day: number;
  label: string;
  muscleGroups: string[];
  isRest: boolean;
};

/** The fixed 8-day rotation. Day numbers are 1-based. */
export const SPLIT: readonly SplitDay[] = [
  { day: 1, label: 'Chest · Shoulders · Triceps', muscleGroups: ['chest', 'shoulders', 'triceps'], isRest: false },
  { day: 2, label: 'Back · Biceps', muscleGroups: ['back', 'biceps'], isRest: false },
  { day: 3, label: 'Legs', muscleGroups: ['legs'], isRest: false },
  { day: 4, label: 'Rest', muscleGroups: [], isRest: true },
  { day: 5, label: 'Arms', muscleGroups: ['biceps', 'triceps', 'shoulders'], isRest: false },
  { day: 6, label: 'Back & Chest', muscleGroups: ['back', 'chest'], isRest: false },
  { day: 7, label: 'Legs', muscleGroups: ['legs'], isRest: false },
  { day: 8, label: 'Rest', muscleGroups: [], isRest: true },
];

export function splitForDay(cycleDay: number): SplitDay {
  return SPLIT[(cycleDay - 1) % 8];
}
