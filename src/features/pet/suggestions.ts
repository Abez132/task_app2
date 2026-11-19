import { overageMinutes } from '@/features/screen-time/limits';

export type Suggestion = {
  id: string;
  icon: string;
  title: string;
  detail: string;
};

type Activity = {
  id: string;
  icon: string;
  title: string;
  detail: (minutes: number) => string;
};

const ACTIVITIES: Activity[] = [
  {
    id: 'walk',
    icon: '🚶',
    title: 'Take a real walk',
    detail: (minutes) =>
      `About ${minutes} minutes outside — roughly ${Math.max(100, minutes * 100)} steps and some daylight.`,
  },
  {
    id: 'read',
    icon: '📖',
    title: 'Read a few pages',
    detail: (minutes) =>
      `Around ${Math.max(3, Math.round(minutes * 1.5))} pages of that book you keep meaning to open.`,
  },
  {
    id: 'stretch',
    icon: '🧘',
    title: 'Stretch it out',
    detail: (minutes) => `${minutes} minutes of stretching resets your back and your head.`,
  },
  {
    id: 'journal',
    icon: '✍️',
    title: 'Write three lines',
    detail: (minutes) =>
      `Use ${Math.min(minutes, 10)} minutes to note what went well today and what you want tomorrow.`,
  },
  {
    id: 'call',
    icon: '📞',
    title: 'Call someone you miss',
    detail: () => 'A five-minute call is worth more than an hour of scrolling.',
  },
  {
    id: 'tidy',
    icon: '🧹',
    title: 'Tidy one small surface',
    detail: (minutes) => `${minutes} minutes is enough for a desk, a shelf or a sink.`,
  },
  {
    id: 'cook',
    icon: '🍳',
    title: 'Make something real',
    detail: () => 'Tea, toast or a proper meal — anything you can actually taste.',
  },
  {
    id: 'learn',
    icon: '🎧',
    title: 'Learn ten new words',
    detail: (minutes) => `${minutes} minutes of practice beats another highlight reel.`,
  },
  {
    id: 'plan',
    icon: '🗒️',
    title: 'Plan tomorrow',
    detail: () => 'Pick your top task and write it down before you close the app.',
  },
  {
    id: 'music',
    icon: '🎸',
    title: 'Practice an instrument',
    detail: (minutes) => `${minutes} minutes of scales is real progress.`,
  },
];

function seedFromDate(date: string): number {
  let hash = 0;
  for (let index = 0; index < date.length; index += 1) {
    hash = (hash * 31 + date.charCodeAt(index)) % 997;
  }
  return hash;
}

function rotate<T>(items: T[], offset: number): T[] {
  if (items.length === 0) return items;
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

type SuggestionInput = {
  totalMinutes: number;
  openTasks: string[];
  /** Local day key, used so the ideas change daily but stay stable during a day. */
  date: string;
  limit?: number;
};

/**
 * Builds "things you could have done instead" from the time spent on social
 * media, mixed with tasks that are still open on the user's list.
 */
export function buildSuggestions({
  totalMinutes,
  openTasks,
  date,
  limit = 4,
}: SuggestionInput): Suggestion[] {
  const over = overageMinutes(totalMinutes);
  // Even under the limit, show ideas sized to the time already spent.
  const minutes = Math.max(5, over || Math.round(totalMinutes));

  const taskSuggestions: Suggestion[] = openTasks.slice(0, 2).map((title, index) => ({
    id: `open-task-${index}`,
    icon: '✅',
    title: `Finish “${title}”`,
    detail: 'Already on your list — and worth points for your pet.',
  }));

  const activitySuggestions = rotate(ACTIVITIES, seedFromDate(date)).map((activity) => ({
    id: activity.id,
    icon: activity.icon,
    title: activity.title,
    detail: activity.detail(minutes),
  }));

  return [...taskSuggestions, ...activitySuggestions].slice(0, limit);
}
