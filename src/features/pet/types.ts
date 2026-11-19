export type PetState = {
  /** Current points. Losing points can drop the pet a level. */
  points: number;
  /** Points earned over the pet's lifetime (never decreases). */
  lifetimePoints: number;
  /** Tasks that already paid out, so un-completing can't farm points. */
  rewardedTaskIds: string[];
  /** Points already deducted per local day (YYYY-MM-DD). */
  penaltiesByDate: Record<string, number>;
  createdAt: string;
  updatedAt: string;
};

export type PetEvent =
  | { type: 'reward'; points: number; taskTitle: string; at: string }
  | { type: 'penalty'; points: number; minutesOver: number; at: string }
  | { type: 'level-up'; level: number; at: string }
  | { type: 'level-down'; level: number; at: string };
