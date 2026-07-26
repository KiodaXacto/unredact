// src/features/archive/types/index.ts

export interface ArchiveEntry {
  /** YYYY-MM-DD */
  id: string;
  date: string;
  difficulty: 'straightforward' | 'challenging' | 'obscure';
  /** Number of redactable words — displayed as a rough article size hint */
  wordCount: number;
}
