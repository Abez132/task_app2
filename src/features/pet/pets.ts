export const PET_NAME = 'Mochi';
export const PET_EMOJI = '🐣';

export type PetLevel = {
  level: number;
  title: string;
  /** Points needed to reach this level. */
  minPoints: number;
  blurb: string;
};

/**
 * Levels are derived from points, so losing points automatically drops the pet
 * back down. Completing tasks is the only way to climb.
 */
export const PET_LEVELS: PetLevel[] = [
  { level: 1, title: 'Newborn', minPoints: 0, blurb: 'A tiny spark waiting for your first win.' },
  { level: 2, title: 'Curious', minPoints: 30, blurb: 'Starting to poke around and explore.' },
  { level: 3, title: 'Steady', minPoints: 70, blurb: 'Growing with every finished task.' },
  { level: 4, title: 'Focused', minPoints: 120, blurb: 'Learning to guard your attention.' },
  { level: 5, title: 'Radiant', minPoints: 180, blurb: 'Glows when you keep your balance.' },
  { level: 6, title: 'Legendary', minPoints: 250, blurb: 'A companion shaped entirely by your habits.' },
];

export const MAX_PET_LEVEL = PET_LEVELS.length;

export function levelForPoints(points: number): PetLevel {
  let current = PET_LEVELS[0];

  for (const candidate of PET_LEVELS) {
    if (points >= candidate.minPoints) {
      current = candidate;
    } else {
      break;
    }
  }

  return current;
}

export function nextLevelFor(level: PetLevel): PetLevel | null {
  return PET_LEVELS.find((candidate) => candidate.level === level.level + 1) ?? null;
}

export type LevelProgress = {
  pointsIntoLevel: number;
  pointsNeeded: number;
  /** 0..1 towards the next level; 1 at max level. */
  ratio: number;
};

export function levelProgressFor(points: number): LevelProgress {
  const level = levelForPoints(points);
  const next = nextLevelFor(level);

  if (!next) {
    return { pointsIntoLevel: points - level.minPoints, pointsNeeded: 0, ratio: 1 };
  }

  const span = next.minPoints - level.minPoints;
  const pointsIntoLevel = points - level.minPoints;

  return {
    pointsIntoLevel,
    pointsNeeded: Math.max(0, next.minPoints - points),
    ratio: Math.min(1, pointsIntoLevel / span),
  };
}
