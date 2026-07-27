// src/features/game/types/index.ts
// All types for the game feature. These are the source of truth.

// ── Raw data (from JSON puzzle file) ─────────────────────────────

export interface RawToken {
  /** The original word/punctuation/whitespace text */
  text: string;
  /** Penn Treebank POS tag (NNP, VBD, DT, IN, etc.) */
  pos: string;
  /** True if this token should always be visible (common stop word) */
  isStopWord: boolean;
  /** True if this token is punctuation (., ,, ;, etc.) */
  isPunctuation: boolean;
}

export interface Puzzle {
  /** YYYY-MM-DD format. Also used as filename key. */
  id: string;
  /** The exact Wikipedia article title */
  title: string;
  /** Pre-normalised title (lowercase, trimmed) for fast comparison */
  normalizedTitle: string;
  /** Alternative acceptable forms: last name, abbreviations, etc. */
  alternateTitles: string[];
  /** Human-readable category e.g. "Person – Science" */
  category: string;
  /** Computed from Wikipedia pageviews + article length */
  difficulty: 'straightforward' | 'challenging' | 'obscure';
  /** First letter of the title — Lumen Level 1 hint */
  firstLetter: string;
  /** A single non-title sentence from the intro — Lumen Level 3 hint */
  sampleSentence: string;
  /** The full token stream for the article */
  tokens: RawToken[];
  /** Raw full text — shown in the post-solve article reader */
  fullTextRaw: string;
  /** Category tags for filtering in unlimited mode */
  categoriesList: string[];
}

// ── Runtime tokens (built from RawToken at puzzle load time) ─────

export interface Token extends RawToken {
  /** Stable index in the token array (used as React key + in inverted index) */
  id: number;
  /** Lowercased text with leading/trailing punctuation stripped */
  normalized: string;
  /** True if this token is a whitespace/newline separator */
  isWhitespace: boolean;
  /** True if this token is a paragraph break (\n\n) */
  isParagraphBreak: boolean;
  /** Current revealed state — mutated via game reducer */
  revealed: boolean;
}

// ── Game state ────────────────────────────────────────────────────

export interface GameState {
  /** The loaded puzzle. Null means loading/not started. */
  puzzle: Puzzle | null;
  /** Flat token array — source of truth for article rendering */
  tokens: Token[];
  /**
   * Inverted index: normalized word → array of token IDs.
   * Built once at puzzle load. Enables O(1) guess lookup.
   * Not stored in localStorage (rebuilt on load).
   */
  invertedIndex: Map<string, number[]>;
  /** All words the player has guessed (normalized), including misses */
  guessedWords: Set<string>;
  /** Count of tokens with revealed=true (excludes stop words) */
  revealedCount: number;
  /** Total tokens that start as redacted (excludes stop words/punctuation) */
  totalRedactedCount: number;
  /** Hint levels the player has actively chosen to reveal */
  hintsUsed: HintLevel[];
  /** True when player has correctly guessed the exact title */
  solved: boolean;
  /** True when player matched an alternate title (shows "Almost!" toast) */
  almostSolved: boolean;
  /** Ordered list of all guess attempts */
  guessHistory: GuessRecord[];
  /** Current game mode — affects progress saving and streak calculation */
  mode: 'daily' | 'archive' | 'unlimited';
  /** Current language of the game */
  language: 'en' | 'fr';
  /** ISO date string of when the game was started */
  startedAt: string | null;
  /** ISO date string of when the game was solved */
  solvedAt: string | null;
}

export interface GuessRecord {
  /** The word as typed by the player (display form) */
  word: string;
  /** Normalized form (used for deduplication) */
  normalizedWord: string;
  /** Number of tokens revealed by this guess (0 = miss) */
  revealCount: number;
  /** True if this guess solved the puzzle */
  isTitle: boolean;
  /** True if this guess matched an alternate title */
  isAlternate: boolean;
  /** Unix timestamp */
  timestamp: number;
}

export type HintLevel = 1 | 2 | 3;

// ── Derived / computed ────────────────────────────────────────────

export interface ScoreResult {
  guessCount: number;
  revealedPercent: number;
  hintsUsedCount: number;
  hintsUsed: HintLevel[];
}

export interface GuessResult {
  /** IDs of tokens that were newly revealed by this guess */
  revealedIds: number[];
  /** Whether the guess matched the article title exactly */
  isTitle: boolean;
  /** Whether the guess matched an alternate title */
  isAlternate: boolean;
  /** Whether the word was found anywhere in the article */
  wasFound: boolean;
  /** How many tokens were revealed */
  revealCount: number;
}

// ── Reducer actions ───────────────────────────────────────────────

export type GameAction =
  | { type: 'LOAD_PUZZLE'; payload: { puzzle: Puzzle; mode: GameState['mode']; language: 'en' | 'fr'; savedState?: Partial<SerializableGameState> } }
  | { type: 'SUBMIT_GUESS'; payload: string }
  | { type: 'USE_HINT'; payload: HintLevel }
  | { type: 'RESET_GAME' };

// ── Serializable state (for localStorage persistence) ─────────────

/** A JSON-safe subset of GameState — stored in localStorage */
export interface SerializableGameState {
  puzzleId: string;
  guessedWords: string[];   // Set → Array
  hintsUsed: HintLevel[];
  solved: boolean;
  almostSolved: boolean;
  guessHistory: GuessRecord[];
  mode: GameState['mode'];
  language: 'en' | 'fr';
  startedAt: string | null;
  solvedAt: string | null;
}

// ── Unlimited mode filters ────────────────────────────────────────

export interface UnlimitedFilters {
  difficulty: 'all' | Puzzle['difficulty'];
  category: string; // 'all' or a category string
}
