# Unredact – Implementation Plan

> **Version:** 1.0 | **Date:** 2026-07-25  
> A faithful, modern rebuild of Redactle as a production-ready React 19 + TypeScript + Vite + TailwindCSS application.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Architecture](#project-architecture)
3. [Phase 1 – Project Scaffold](#phase-1--project-scaffold)
4. [Phase 2 – Folder Structure & Design System](#phase-2--folder-structure--design-system)
5. [Phase 3 – Core Game Engine](#phase-3--core-game-engine)
6. [Phase 4 – Article Renderer](#phase-4--article-renderer)
7. [Phase 5 – Guess Engine & Input](#phase-5--guess-engine--input)
8. [Phase 6 – State Management & Persistence](#phase-6--state-management--persistence)
9. [Phase 7 – Full User Interface](#phase-7--full-user-interface)
10. [Phase 8 – Hint System (Lumen)](#phase-8--hint-system-lumen)
11. [Phase 9 – Archive Mode](#phase-9--archive-mode)
12. [Phase 10 – Unlimited Mode](#phase-10--unlimited-mode)
13. [Phase 11 – PWA Support](#phase-11--pwa-support)
14. [Phase 12 – Testing](#phase-12--testing)
15. [Phase 13 – Deployment & DevOps](#phase-13--deployment--devops)
16. [Content Pipeline (Admin Tool)](#content-pipeline-admin-tool--never-deployed)
17. [Key Technical Decisions](#key-technical-decisions)
18. [Verification Plan](#verification-plan)
19. [Development Roadmap](#development-roadmap)
20. [Risk Analysis](#risk-analysis)

---

## Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend framework** | React 19 | Spec requirement; concurrent features for smooth rendering |
| **Language** | TypeScript (strict) | Type safety across 13 phases |
| **Build tool** | Vite 5 | Fast HMR, native ESM, best-in-class DX |
| **Styling** | TailwindCSS v3 | Spec requirement; PurgeCSS = zero unused CSS in prod |
| **Routing** | React Router v6 | Required for `/archive/:date`, `/unlimited` deep links |
| **State** | `useReducer` + Context | Predictable state machine; Redux overhead not needed |
| **Testing** | Vitest + React Testing Library | Native to Vite, fastest test runner |
| **PWA** | `vite-plugin-pwa` + Workbox | Best-in-class, Vite-native, maintained by Vite team |

**Do NOT use:** Redux, MobX, Zustand, GraphQL, Next.js, Remix, Angular, Vue, Svelte.

---

## Project Architecture

Feature-based architecture. Each feature owns its components, hooks, types, tests, and utilities.

```
src/
  app/
    App.tsx              # Root component + providers
    Router.tsx           # React Router v6 routes
  features/
    game/
      components/        # ArticleRenderer, GuessInput, GuessHistory, ScoreBoard
      hooks/             # useGameState, useGuessEngine, usePuzzle
      types/             # Puzzle, Token, GameState, GuessResult
      utils/             # tokenizer, normalizer, stopWords, gameEngine
      GamePage.tsx
    archive/
      components/        # ArchiveCalendar, ArchiveCard
      hooks/             # useArchive
      ArchivePage.tsx
    hints/
      components/        # HintPanel, LumenIcon
      hooks/             # useHints
    settings/
      components/        # SettingsModal, ThemeToggle, FontSizeControl
      hooks/             # useSettings
    statistics/
      components/        # StatsModal, ShareButton, ScoreGrid
      hooks/             # useStatistics
  components/
    ui/                  # Button, Modal, Toast, Badge, Tooltip
    layout/              # Header, Footer, PageLayout
    accessibility/       # SkipLink, VisuallyHidden, FocusTrap
  hooks/
    useLocalStorage.ts
    useKeyboard.ts
    useMediaQuery.ts
  services/
    puzzleService.ts     # Load daily/archive/unlimited puzzles
    storageService.ts    # LocalStorage CRUD abstraction
  types/
    index.ts             # Re-exports all shared types
  utils/
    date.ts              # Date helpers (today's puzzle ID)
    string.ts            # Normalization, strip punctuation
    share.ts             # Clipboard / share API
  assets/
    icons/
    fonts/
  data/
    puzzles/             # Static JSON puzzle files (one per date)
    archive-index.json   # Lightweight archive metadata index
    unlimited-index.json # Unlimited mode puzzle pool index
    stopWords.ts         # Stop word list (~150 words)
  styles/
    globals.css          # Tailwind base + custom CSS variables
tools/
  pipeline/              # Admin tool — NEVER deployed
    fetch-article.ts
    tokenize.ts
    pos-tag.ts
    compute-difficulty.ts
    generate-puzzle.ts
    package.json
```

---

## Phase 1 – Project Scaffold

Bootstrap via `npm create vite@latest . -- --template react-ts`, then add dependencies.

### Files Created

| File | Purpose |
|---|---|
| `package.json` | Dependencies + scripts |
| `tsconfig.json` | Strict TypeScript config |
| `tsconfig.node.json` | Node config for Vite |
| `vite.config.ts` | Vite config: path aliases, PWA plugin, build optimization |
| `tailwind.config.ts` | Design tokens: colors, typography, spacing |
| `postcss.config.js` | PostCSS pipeline |
| `.eslintrc.cjs` | ESLint rules (TypeScript strict) |
| `.prettierrc` | Code formatting |
| `.env.example` | Environment variable template |
| `index.html` | App shell: SEO meta, skip link, CSP nonce hint |
| `public/_headers` | Cloudflare Pages HTTP headers (CSP, HSTS) |
| `public/_redirects` | SPA fallback: `/* /index.html 200` |

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.26.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "jest-axe": "^9.0.0"
  }
}
```

---

## Phase 2 – Folder Structure & Design System

Establish the full directory structure, barrel exports, and design tokens.

### Design Tokens (Tailwind config)

```typescript
// tailwind.config.ts
colors: {
  // Dark theme (default)
  bg: {
    primary:   '#1A1A1A',  // page background
    secondary: '#242424',  // card/panel background
    redacted:  '#2A2A2A',  // redacted word blocks
  },
  text: {
    primary:   '#F5F0E6',  // revealed text (cream)
    muted:     '#8A8A8A',  // stop words, punctuation
    accent:    '#E6A817',  // amber — hints, buttons, focus rings
  },
  pos: {
    noun:   '#3B82F6',  // soft blue
    verb:   '#22C55E',  // soft green
    number: '#A855F7',  // soft purple
    adj:    '#F97316',  // soft orange
  },
  badge: {
    easy:       '#3B82F6',  // Straightforward 🔵
    medium:     '#EAB308',  // Challenging 🟡
    hard:       '#EF4444',  // Obscure 🔴
  }
}
```

### Typography

- **Body:** `Inter` (Google Fonts) — clean, readable sans-serif
- **Article text:** `Georgia` or `Inter` — adjustable via settings
- **Font sizes:** `sm` (14px), `md` (16px, default), `lg` (18px)

---

## Phase 3 – Core Game Engine

**Pure TypeScript. Zero UI. Fully tested.**

### TypeScript Interfaces

```typescript
// src/features/game/types/index.ts

export interface RawToken {
  text: string;
  pos: string;           // Penn Treebank POS tag (NNP, VBD, DT, etc.)
  isStopWord: boolean;
  isPunctuation: boolean;
}

export interface Token extends RawToken {
  id: number;            // stable array index
  normalized: string;    // lowercase, punctuation-stripped
  isWhitespace: boolean;
  revealed: boolean;
}

export interface Puzzle {
  id: string;                    // "2026-07-25"
  title: string;                 // "Charles Darwin"
  normalizedTitle: string;       // "charles darwin"
  alternateTitles: string[];     // ["darwin", "charles robert darwin"]
  category: string;              // "Person – Science"
  difficulty: 'straightforward' | 'challenging' | 'obscure';
  firstLetter: string;           // "C"
  sampleSentence: string;        // Lumen Level 3 hint
  tokens: RawToken[];            // full article token stream
  fullTextRaw: string;           // raw text for post-solve reader
  categoriesList: string[];
}

export interface GameState {
  puzzle: Puzzle | null;
  tokens: Token[];
  invertedIndex: Map<string, number[]>;  // normalized word → token ids (O(1) lookup)
  guessedWords: Set<string>;
  revealedCount: number;
  totalRedactedCount: number;
  hintsUsed: HintLevel[];
  solved: boolean;
  almostSolved: boolean;       // alternate title matched
  guessHistory: GuessRecord[];
  mode: 'daily' | 'archive' | 'unlimited';
}

export interface GuessRecord {
  word: string;
  normalizedWord: string;
  revealCount: number;         // how many tokens were revealed
  isTitle: boolean;
  isAlternate: boolean;
  timestamp: number;
}

export type HintLevel = 1 | 2 | 3;

export interface ScoreResult {
  guessCount: number;
  revealedPercent: number;
  hintsUsedCount: number;
  hintsUsed: HintLevel[];
}
```

### Game Engine Functions

```
src/features/game/utils/gameEngine.ts

buildTokens(rawTokens: RawToken[]): Token[]
  → Assigns stable IDs, computes normalized form, marks whitespace

buildInvertedIndex(tokens: Token[]): Map<string, number[]>
  → O(n) build. Maps each unique normalized word → array of token IDs
  → Skips stop words, punctuation, whitespace

normalizeWord(word: string): string
  → lowercase + strip leading/trailing punctuation

processGuess(word: string, state: GameState): GuessResult
  → Normalizes input
  → Checks invertedIndex for matching token IDs
  → Returns: { revealedIds, isTitle, isAlternate, revealCount }
  → Does NOT mutate state (pure function)

computeScore(state: GameState): ScoreResult
  → revealedPercent = revealedCount / totalRedactedCount * 100

generateShareText(state: GameState): string
  → Emoji grid: 🟩🟩🟩🏆 💡1
```

### State Reducer Actions

```typescript
type GameAction =
  | { type: 'LOAD_PUZZLE'; payload: Puzzle }
  | { type: 'SUBMIT_GUESS'; payload: string }
  | { type: 'USE_HINT'; payload: HintLevel }
  | { type: 'RESTORE_STATE'; payload: Partial<GameState> }
  | { type: 'RESET_GAME' }
```

### Stop Word List (`src/data/stopWords.ts`)

Complete NLTK-style list (~150 words): the, of, in, a, to, and, is, was, it, that, he, she, they, this, at, by, from, with, on, for, as, an, be, are, were, has, had, have, his, her, its, their, been, but, or, not, what, which, who, one, all, would, there, when, out, about, than, up, more, also, into, so, if, no, such, then, some, could, them, other, after, before, under, two, first, new, time, these, those, may, will...

---

## Phase 4 – Article Renderer

**The most performance-critical component.**

### `ArticleRenderer.tsx`

- Receives `tokens: Token[]` — **stable reference**, only `revealed` property changes
- Groups tokens into paragraph arrays (split on `\n\n` whitespace tokens)
- Renders each paragraph as a `<p>` element containing `<TokenSpan>` components
- Uses `React.memo` to prevent full re-renders
- `useMemo` for paragraph grouping (recalculates only when `tokens` reference changes)

### `TokenSpan.tsx` (memoized)

A single `React.memo` component receiving only primitive props:

```typescript
interface TokenSpanProps {
  id: number;
  text: string;
  pos: string;
  isStopWord: boolean;
  isPunctuation: boolean;
  revealed: boolean;
  posColorsEnabled: boolean;
}
```

**Rendering logic:**
- `isStopWord || isPunctuation` → plain text, always visible, `text-muted`
- `revealed = true` → visible word, optional POS color class
- `revealed = false` → black bar: `<span aria-label="redacted word" role="img" style={{ width: `${text.length * 0.6}em` }} />`

**POS color classes** (Tailwind `data-pos` + CSS):
- `NNP, NN, NNS, NNPS` → `data-pos="noun"` → blue highlight
- `VB, VBD, VBG, VBN, VBP, VBZ` → `data-pos="verb"` → green
- `CD` → `data-pos="number"` → purple
- `JJ, RB` → `data-pos="adj"` → orange

### Performance Targets

| Scenario | Target |
|---|---|
| Initial render (5,000 tokens) | < 50ms |
| Per-guess reveal update | < 5ms |
| Re-renders per guess | Only affected tokens (via inverted index) |

---

## Phase 5 – Guess Engine & Input

### `GuessInput.tsx`

- Fixed bottom bar (desktop) / top bar (mobile)
- Text input with `Enter` key submit + "Guess" button
- Displays guess count badge
- `aria-live="polite"` region announces: `"Word revealed: evolution (×14)"` or `"Word not found"`
- Clears input on submit
- Disabled state when game is solved

### `GuessHistory.tsx`

- Scrollable panel listing all submitted guesses
- Each row shows: word, reveal count (or "not found"), timestamp
- Color coding:
  - 🏆 Gold — title guess (solved)
  - 🟩 Green — revealed ≥ 1 token
  - ⬜ Muted — word not found in article
- Uses CSS `contain: content` for virtualization when > 200 entries (no library needed)

---

## Phase 6 – State Management & Persistence

### `useGameState.ts`

Top-level hook wrapping `useReducer`. Exposes:
- `state: GameState`
- `dispatch: Dispatch<GameAction>`
- `submitGuess(word: string): void`
- `useHint(level: HintLevel): void`
- `resetGame(): void`

### LocalStorage Keys (namespaced)

```
unredact:daily:progress:{YYYY-MM-DD}   → Serialized partial GameState
unredact:archive:progress:{id}         → Serialized partial GameState
unredact:stats                         → Aggregated statistics
unredact:settings                      → Theme, font size, POS toggle
unredact:archive:played                → JSON array of played archive IDs
```

### `storageService.ts`

```typescript
get<T>(key: string, fallback: T): T
set<T>(key: string, value: T): void
remove(key: string): void
saveDailyProgress(date: string, state: Partial<GameState>): void
loadDailyProgress(date: string): Partial<GameState> | null
saveStats(stats: Statistics): void
loadStats(): Statistics
```

### `puzzleService.ts`

```typescript
getDailyPuzzle(): Promise<Puzzle>
  → Fetches /data/puzzles/{today}.json

getArchivePuzzle(id: string): Promise<Puzzle>
  → Fetches /data/puzzles/{id}.json (lazy, on demand)

getUnlimitedPuzzle(filters: UnlimitedFilters): Promise<Puzzle>
  → Loads unlimited-index.json, filters, picks random, fetches puzzle
```

---

## Phase 7 – Full User Interface

### `Header.tsx`

```
┌─────────────────────────────────────────────────────────┐
│  [≡]  Unredact        July 25, 2026  [🔵 Easy]   [☀️]  │
└─────────────────────────────────────────────────────────┘
```

- Hamburger → side drawer: Archive | Unlimited | Settings | About | Stats
- Difficulty badge: colored pill (🔵/🟡/🔴)
- Theme toggle: sun/moon icon, `aria-label="Toggle dark mode"`

### `SettingsModal.tsx`

| Setting | Options |
|---|---|
| Theme | Dark / Light / System |
| Font size | Small / Medium / Large |
| Smart Reveal Streaks (POS colors) | Off (default) / On |
| High contrast | Off / On |
| Reduced motion | Follows OS `prefers-reduced-motion` |

### `StatsModal.tsx`

- Games played, current streak, best streak, win rate
- Pure CSS bar chart showing guess distribution
- Share button using Web Share API (fallback to clipboard)

### Post-Solve Overlay

Triggered when `state.solved === true`:

```
┌─────────────────────────────────────────────────────────────┐
│                          🏆                                  │
│                  Charles Darwin                             │
│                                                             │
│  "He is best known for his contributions to the theory      │
│   of evolution by natural selection..."                     │
│                                                             │
│  Guesses: 23   Revealed: 18.4%   Hints: 💡1                │
│                                                             │
│  [  Read the Full Article  ]   [  Share Result  ]           │
│                              [✕ View Revealed Article]      │
└─────────────────────────────────────────────────────────────┘
```

- Focus trapped inside modal
- ESC or ✕ → close overlay, return to fully revealed article
- "Read the Full Article" → dissolves overlay, renders clean article reader
- `aria-live` announces pull quote to screen readers

### `Toast.tsx`

- `aria-live="polite"` announcement region
- Auto-dismisses after 3 seconds
- Queue: max 3 visible at once
- Messages:
  - `"Word not found in article"` (muted)
  - `"word revealed ×14"` (green)
  - `"Almost! You've found the subject. Try the full title."` (amber)
  - `"Hint unlocked! 💡 Level 1 available"` (amber)

---

## Phase 8 – Hint System (Lumen)

### Thresholds

| Level | Unlocks at | Hint Content |
|---|---|---|
| 1 | 50 guesses | `"First letter: C"` |
| 2 | 80 guesses | `"Category: Person – Science"` |
| 3 | 120 guesses | Unredacts the sample sentence in the article |

### `useHints.ts`

```typescript
const { availableHints, revealHint, hintsUsed } = useHints(guessCount, puzzle)
```

- Compares `guessCount` to thresholds [50, 80, 120]
- Returns available-but-not-yet-revealed hints
- Level 3: dispatches `USE_HINT` → game engine marks sample sentence tokens as revealed

### `HintPanel.tsx`

- Lightbulb icon in header area: grey when locked, amber pulse when available
- Click → expands accordion panel below article
- Each level shows: locked state (🔒), available (click to reveal), revealed (content shown)
- Using hint is logged in `hintsUsed` and shown in final score

---

## Phase 9 – Archive Mode

### `ArchivePage.tsx`

- URL: `/archive`
- Calendar grid view (month-by-month)
- Each cell: date, difficulty badge color, ✓ checkmark if played (from localStorage)
- Click on past puzzle → navigates to `/archive/2026-07-20` → loads that puzzle JSON
- Share text includes `"Archived"` marker
- Does **not** update daily streak counter

### `archive-index.json`

Lightweight index loaded once for the calendar — no token data:

```json
[
  { "id": "2026-07-25", "date": "2026-07-25", "difficulty": "straightforward", "wordCount": 3241 },
  { "id": "2026-07-24", "date": "2026-07-24", "difficulty": "challenging", "wordCount": 7892 }
]
```

---

## Phase 10 – Unlimited Mode

### `UnlimitedPage.tsx`

- URL: `/unlimited`
- Filter bar: Difficulty (All / Straightforward / Challenging / Obscure), Category (All / Science / History / Geography / Arts...)
- "Start New Puzzle" button
- Same `GamePage` component re-used with `mode='unlimited'`
- Progress NOT saved to daily streak

### `unlimited-index.json`

```json
[
  { "id": "eiffel-tower", "difficulty": "straightforward", "category": "Geography" },
  { "id": "black-hole",   "difficulty": "challenging",     "category": "Science" }
]
```

---

## Phase 11 – PWA Support

### Service Worker Strategy (Workbox via `vite-plugin-pwa`)

| Resource type | Strategy | TTL |
|---|---|---|
| App shell (HTML/CSS/JS) | CacheFirst | Until new build deploy |
| Today's puzzle JSON | StaleWhileRevalidate | 24 hours |
| Archive puzzle JSONs | NetworkFirst | On demand |
| Google Fonts | CacheFirst | 1 year |

### `manifest.webmanifest`

```json
{
  "name": "Unredact",
  "short_name": "Unredact",
  "description": "Daily Wikipedia word puzzle",
  "theme_color": "#1A1A1A",
  "background_color": "#1A1A1A",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Offline Behaviour

- App shell: loads from cache instantly
- Today's puzzle: loads from cache if offline (previously loaded)
- Archive puzzles: shows "offline – puzzle unavailable" if not previously cached
- Install prompt: shown after first visit (add to home screen)

---

## Phase 12 – Testing

### Unit Tests (Vitest)

| Test file | Covers |
|---|---|
| `gameEngine.test.ts` | `normalizeWord`, `buildInvertedIndex`, `processGuess`, `computeScore`, `generateShareText` |
| `stopWords.test.ts` | All ~150 stop words correctly identified |
| `storageService.test.ts` | get/set/remove, daily progress save/load, stats |
| `puzzleService.test.ts` | Correct URL construction, error handling |

### Component Tests (React Testing Library)

| Test file | Covers |
|---|---|
| `TokenSpan.test.tsx` | Redacted bar renders, revealed text shows, ARIA labels |
| `ArticleRenderer.test.tsx` | Paragraph breaks, stop word visibility, token count |
| `GuessInput.test.tsx` | Submit on Enter, submit on click, ARIA announce, disabled state |
| `HintPanel.test.tsx` | Locked → available → revealed state transitions |
| `Toast.test.tsx` | Renders messages, auto-dismiss, queue |
| `StatsModal.test.tsx` | Streak display, share button |

### Integration Tests

| Test file | Covers |
|---|---|
| `gameFlow.test.tsx` | Full game: load → guess → reveal → solve → overlay |
| `archiveFlow.test.tsx` | Load archive puzzle, play, verify daily streak untouched |
| `hintsFlow.test.tsx` | Guess 50/80/120 times, verify hint unlock sequence |

### Accessibility Tests (`jest-axe`)

- Every page/modal passes automated WCAG 2.1 AA scan
- Focus trap tested in post-solve overlay and archive modal
- Keyboard navigation: Tab order verified for all interactive elements

### Test Commands

```bash
npm run test              # Watch mode
npm run test:run          # Single run (CI)
npm run test:coverage     # Coverage report (target: >80%)
```

---

## Phase 13 – Deployment & DevOps

### `Dockerfile` (multi-stage)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/data /usr/share/nginx/html/data
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### `docker-compose.yml`

```yaml
services:
  web:
    build: .
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data:/usr/share/nginx/html/data
      - ./certs:/etc/nginx/certs
    restart: unless-stopped
```

### `nginx.conf` (security headers)

```nginx
add_header Content-Security-Policy "default-src 'self'; ...";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### `.env.example`

```env
VITE_APP_NAME=Unredact
VITE_APP_URL=https://unredact.com
VITE_DAILY_PUZZLE_BASE_URL=/data/puzzles
```

---

## Content Pipeline (Admin Tool – Never Deployed)

Located in `tools/pipeline/` — standalone Node.js scripts.

```bash
# Generate a puzzle for a specific date
npx tsx tools/pipeline/generate-puzzle.ts \
  --date 2026-07-26 \
  --article "Eiffel_Tower"

# Output: src/data/puzzles/2026-07-26.json
# Then: git add + commit + push → auto-deploys
```

### Pipeline Steps

1. **`fetch-article.ts`** — Wikipedia REST API → clean HTML (remove refs, nav, tables)
2. **`tokenize.ts`** — Split into tokens, detect punctuation and whitespace
3. **`stopWords.ts`** — Mark stop words using the shared stop word list
4. **`pos-tag.ts`** — POS tagging via `compromise` (lightweight JS NLP, 40 KB)
5. **`compute-difficulty.ts`** — Wikipedia pageview API → difficulty score
6. **`generate-puzzle.ts`** — Orchestrates all steps, validates output, writes JSON

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| State management | `useReducer` + Context | Predictable state machine; Redux overhead not needed |
| Guess lookup | Inverted index `Map<string, number[]>` | O(1) per guess; avoids scanning 5000+ tokens |
| Token rendering | Flat `<span>` tree, `React.memo` | Fastest possible DOM; only changed tokens re-render |
| Routing | React Router v6 | Required for deep-linkable archive/unlimited URLs |
| PWA | `vite-plugin-pwa` + Workbox | Vite-native, well-maintained, zero boilerplate |
| POS tagging | Pre-computed in puzzle JSON | Zero runtime overhead; purely CSS class application |
| Analytics | None initially | Privacy-first; Plausible stub added later if needed |
| Testing | Vitest + RTL | Native to Vite; fastest test runner in ecosystem |
| Stats chart | Pure CSS bars | No Chart.js overhead for simple distributions |
| Article reader | Existing token array, all `revealed=true` | No second render path; reuse game renderer |

---

## Verification Plan

### Automated Tests

```bash
npm run lint              # ESLint check (zero warnings policy)
npm run type-check        # tsc --noEmit
npm run test:run          # Full test suite
npm run test:coverage     # >80% coverage required
npm run build             # Vite production build
npm run preview           # Serve dist/ locally
```

### Lighthouse Targets

| Metric | Target |
|---|---|
| Performance | > 95 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | > 95 |
| Bundle size (gzipped) | < 300 KB |
| LCP | < 1.5 seconds |
| Initial load | < 1 second |

### Manual Verification Checklist

- [ ] Play complete daily game: guess → reveal → solve → share
- [ ] Archive: navigate to past puzzle, play, confirm daily streak unchanged
- [ ] Unlimited: apply difficulty filter, start game, play to completion
- [ ] Hints: reach guess 50/80/120, verify Lumen unlock sequence
- [ ] PWA: install to home screen, go offline, verify game loads
- [ ] Keyboard only: navigate entire game without mouse
- [ ] Screen reader: VoiceOver (macOS) / NVDA (Windows) pass
- [ ] High contrast: toggle on, verify all text remains readable
- [ ] Reduced motion: enable OS setting, verify no disruptive animations

---

## Development Roadmap

| Phase | Deliverable | Complexity | Key Files |
|---|---|---|---|
| **1** | Project scaffold + tooling | Low | `package.json`, `vite.config.ts`, `tailwind.config.ts` |
| **2** | Folder structure + design tokens | Low | All `index.ts` barrels, `globals.css` |
| **3** | Core game engine | **High** | `gameEngine.ts`, `types/index.ts`, `stopWords.ts` |
| **4** | Article renderer + TokenSpan | **High** | `ArticleRenderer.tsx`, `TokenSpan.tsx` |
| **5** | Guess input + history | Medium | `GuessInput.tsx`, `GuessHistory.tsx` |
| **6** | State + persistence | Medium | `useGameState.ts`, `storageService.ts`, `puzzleService.ts` |
| **7** | Full UI | **High** | `Header.tsx`, `SettingsModal.tsx`, `StatsModal.tsx`, post-solve overlay |
| **8** | Lumen hint system | Medium | `useHints.ts`, `HintPanel.tsx` |
| **9** | Archive mode | Medium | `ArchivePage.tsx`, `archive-index.json` |
| **10** | Unlimited mode | Low | `UnlimitedPage.tsx`, `unlimited-index.json` |
| **11** | PWA | Medium | `vite.config.ts` (PWA), `manifest.webmanifest` |
| **12** | Testing suite | Medium | All `*.test.ts(x)` files |
| **13** | Docker + deployment | Low | `Dockerfile`, `docker-compose.yml`, `nginx.conf` |

**Total: 13 phases — each independently compilable and production-ready.**

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Token rendering performance (>5000 tokens) | Medium | High | `React.memo` on `TokenSpan`, inverted index for O(1) updates |
| Tailwind bundle size | Low | Medium | PurgeCSS built into Tailwind v3; unused classes never ship |
| LocalStorage model changes between versions | Medium | Medium | Versioned storage keys + migration utility in `storageService` |
| Wikipedia CC BY-SA copyright | Low | Low | Attribution in footer; content is explicitly CC licensed |
| PWA serving stale puzzle after midnight | Medium | Medium | Cache key includes puzzle date; Workbox handles invalidation |
| Puzzle JSON size > 50 KB | Low | Medium | Gzip on server; target < 50 KB; omit `fullTextRaw` from token stream |
| React 19 breaking changes | Low | Medium | Pin exact React version; test each phase before proceeding |
| `compromise` NLP accuracy | Medium | Low | POS tags are cosmetic (Smart Reveal Streaks); inaccuracies are benign |

---

*Last updated: 2026-07-25 | Status: Awaiting approval to begin Phase 1*
