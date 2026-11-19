export type PetLevel = {
  level: number;
  /** The companion's name in this form. */
  name: string;
  emoji: string;
  title: string;
  /** Points needed to reach this level. */
  minPoints: number;
  blurb: string;
  /** Decorative mark scattered around the avatar. */
  aura: string;
  colors: {
    ring: string;
    core: string;
    glow: string;
    accent: string;
  };
};

/**
 * A different companion for every level. Levels are derived from points, so
 * losing points (excess social media) can send the pet back to an earlier form.
 */
export const PET_LEVELS: PetLevel[] = [
  {
    level: 1,
    name: 'Pip',
    emoji: '🐣',
    title: 'Hatchling',
    minPoints: 0,
    blurb: 'A tiny spark waiting for your first win.',
    aura: '✦',
    colors: {
      ring: '#FFD6A5',
      core: '#2A2233',
      glow: 'rgba(255, 214, 165, 0.10)',
      accent: '#FFD6A5',
    },
  },
  {
    level: 2,
    name: 'Momo',
    emoji: '🐥',
    title: 'Fledgling',
    minPoints: 30,
    blurb: 'Fluffier, louder, and starting to explore.',
    aura: '✧',
    colors: {
      ring: '#FFE08A',
      core: '#2E2A1C',
      glow: 'rgba(255, 224, 138, 0.12)',
      accent: '#FFE08A',
    },
  },
  {
    level: 3,
    name: 'Nimbus',
    emoji: '🦊',
    title: 'Scout',
    minPoints: 70,
    blurb: 'Quick on its feet and curious about everything.',
    aura: '✦',
    colors: {
      ring: '#FFB27A',
      core: '#33231B',
      glow: 'rgba(255, 178, 122, 0.12)',
      accent: '#FFB27A',
    },
  },
  {
    level: 4,
    name: 'Sable',
    emoji: '🐺',
    title: 'Guardian',
    minPoints: 120,
    blurb: 'Guards your focus like it is part of the pack.',
    aura: '✧',
    colors: {
      ring: '#9CC7FF',
      core: '#1B2433',
      glow: 'rgba(156, 199, 255, 0.12)',
      accent: '#9CC7FF',
    },
  },
  {
    level: 5,
    name: 'Ember',
    emoji: '🐉',
    title: 'Drake',
    minPoints: 180,
    blurb: 'Breathes a little fire into every finished task.',
    aura: '✦',
    colors: {
      ring: '#C08CFF',
      core: '#261B33',
      glow: 'rgba(192, 140, 255, 0.14)',
      accent: '#C08CFF',
    },
  },
  {
    level: 6,
    name: 'Astra',
    emoji: '🦄',
    title: 'Ascended',
    minPoints: 250,
    blurb: 'A companion shaped entirely by your habits.',
    aura: '✧',
    colors: {
      ring: '#FF9EDB',
      core: '#2B1B2A',
      glow: 'rgba(255, 158, 219, 0.14)',
      accent: '#FF9EDB',
    },
  },
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

export function petForLevel(level: number): PetLevel {
  return PET_LEVELS.find((candidate) => candidate.level === level) ?? PET_LEVELS[0];
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
