// src/features/statistics/types/index.ts

export interface DailyStats {
  date: string;
  puzzleId: string;
  guessCount: number;
  revealedPercent: number;
  hintsUsed: number;
  solved: boolean;
  durationMs: number;
}

export interface Statistics {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
  history: DailyStats[];
}
