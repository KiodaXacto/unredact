# Unredact – Product Specification Document

**Version:** 1.0  
**Target Platform:** Web (responsive, mobile-first)  
**Goal:** Rebuild and rebrand the “Redactle” game with enhanced UX, accessibility, hint systems, and educational features while preserving the exact original puzzle mechanics.

---

## 1. Executive Summary

Unredact is a daily word puzzle game where the entire text of a Wikipedia article is redacted (black bars) except for common stop words and punctuation. Players type words to reveal them in the article, with the goal of guessing the exact article title.  
The remake introduces a polished UI, a tiered hint system (“Lumen”), flexible title recognition, a daily difficulty badge, an article archive, post-solve educational nudges, and full accessibility. The core gameplay loop remains unchanged.

---

## 2. Core Gameplay (Preserved Mechanics)

- **Article source:** One Wikipedia article per day (daily mode), plus an unlimited pool for practice.
- **Redaction:** All words except a fixed list of stop words (the, of, in, a, to, and, is, etc.) and punctuation are hidden behind opaque blocks.
- **Guessing:** Player types a single word. If the word exists in the article (case-insensitive, exact match, stripped of punctuation), all occurrences are instantly revealed.
- **Reveal persistence:** Revealed words stay uncovered for the rest of the game.
- **Goal:** Guess the exact title of the Wikipedia article.
- **Guessing is unlimited:** No penalty for incorrect guesses. No time limit.
- **Scoring:** Track total guesses taken and the percentage of words in the article that were revealed (lower is better). The final score is presented as a shareable grid.

---

## 3. New Features Overview

| Feature | Description |
|---------|-------------|
| Lumen Hint System | Tiered, optional hints unlocked after set guess counts (first letter, category, sample sentence). |
| Title Flexibility | Recognises close topic guesses (alternate names, core subject) with a nudge, without counting them as a final solve. |
| Daily Difficulty Badge | Each daily puzzle shows a difficulty level (Straightforward, Challenging, Obscure) based on article popularity and length. |
| Post-Solve Reading Nudge | After solving, a gentle prompt to read the full article, with the first paragraph highlighted. |
| Archive Mode | Play any past daily puzzle. Clearly marked as “archived”, does not affect daily streak. |
| Smart Reveal Streaks | Optional subtle colour tinting of revealed words by part of speech (nouns, verbs, numbers). |
| Dark/Light Mode | Toggleable theme with high contrast support. |
| Accessibility | Full keyboard nav, screen-reader labels, focus management, skip links. |
| Unlimited Mode with Filters | Practice mode with optional filtering by difficulty or broad topic. |

---

## 4. User Interface Design

### 4.1 Layout
- **Header:** Game logo (partially lifted blindfold over a book), daily puzzle date, dark/light mode toggle, hamburger menu (Archive, Unlimited, Settings, About).
- **Game Area:**
  - Redacted article: full text rendered as a block of black bars with visible stop words and punctuation. Whitespace and paragraph structure preserved.
  - Input bar: fixed at the bottom (or top on mobile), text input + “Guess” button.
  - Hints panel (Lumen): unobtrusive expandable area below the article or a small icon that shows available hints.
- **Post-Solve Overlay:** Slides in after title guess. Shows pull quote, “Read the Full Article” button, share button, score grid.

### 4.2 Visual Style
- Default dark theme: deep charcoal background (#1A1A1A), redacted blocks slightly lighter (#2A2A2A), revealed text cream (#F5F0E6). Accent colour: warm amber (#E6A817) for hints, buttons.
- Light theme: soft off-white background, dark redacted bars, charcoal text.
- Typography: Readable, scaling serif or sans-serif (e.g., Inter or Georgia), adjustable size (small/medium/large).

---

## 5. Technical Architecture

### 5.1 High-Level Overview
- **Frontend:** Single Page Application (SPA) framework (React/Vue/Svelte).  
- **Backend (optional but recommended):** Lightweight Node.js/Python API for daily puzzle serving, statistics, and archive management. Can also be fully static with pre-generated JSON puzzles, enabling no backend cost.  
- **Data:** All daily article data pre-processed and stored as static JSON files (original text, redacted mapping, title, category, difficulty). Unlimited pool similarly pre-generated.  
- **Hosting:** Static site (Netlify/Vercel/Cloudflare Pages) with a thin API layer if needed (e.g., for daily puzzle rotation without client-side clock dependency).  
- **Storage:** Client-side local storage for user preferences (theme, font size), daily progress, archive completion, optional opt-in anonymous statistics.

### 5.2 Frontend State Management
- **Game state object:**  
  - `articleId`, `fullTextTokens` (array of {word, isStopWord, isPunctuation, revealed}), `guessedWords` set, `title` (exact), `alternateTitles` (list of acceptable near-matches), `totalWords`, `revealedCount`, `hintsUsed` (list), `lumenHintsUnlocked` (by threshold), `solved`.
- **Derived:** `wordsRevealedPercentage`, `guessesCount`.

### 5.3 Key Algorithms
- **Redaction rendering:** Traverse token array. If `isStopWord` or `isPunctuation`, display as plain text; else if `revealed` is true, show word; else show a redacted block of width proportional to word length.
- **Word matching on guess:** Normalize input (trim, lower case). Check if in `fullTextTokens` (ignore punctuation for match). If found, set `revealed = true` for all matching tokens, update `revealedCount`.
- **Win detection:** After each guess, check if the guessed word (original case) equals the `title` (case-insensitive). Also check if it matches an alternate title → trigger “Almost!” nudge.
- **Lumen hint thresholds:** After `guessesCount` reaches 50, 80, 120 (configurable), unlock hints. The hints are pre-calculated per article: first letter, category, sample sentence.

### 5.4 External Dependencies
- **Wikipedia API (for puzzle generation):** Not used at runtime. A separate admin script will fetch random/curated articles, clean them, and store as JSON.  
- **Part-of-speech tagging (for Smart Reveal Streaks):** Pre-process each token with a POS tagger (e.g., Node.js `compromise` or Python NLTK) and store tag in token data. Client-side just applies CSS class.  
- **No user accounts; no external auth.** All data stored locally.

---

## 6. Data Models

### 6.1 Daily Puzzle JSON Structure
```json
{
  "id": "2026-07-25",
  "title": "Charles Darwin",
  "alternateTitles": ["Darwin", "Charles Robert Darwin"],
  "category": "Person – Science",
  "difficulty": "straightforward",
  "firstLetter": "C",
  "sampleSentence": "He is best known for his contributions to the theory of evolution.",
  "tokens": [
    { "text": "Charles", "pos": "NNP", "isStopWord": false, "isPunctuation": false },
    { "text": "Darwin", "pos": "NNP", "isStopWord": false, "isPunctuation": false },
    { "text": "was", "pos": "VBD", "isStopWord": true, "isPunctuation": false },
    { "text": "a", "pos": "DT", "isStopWord": true, "isPunctuation": false },
    { "text": "British", "pos": "JJ", "isStopWord": false, "isPunctuation": false },
    ...
  ],
  "fullTextRaw": "Charles Darwin was a British naturalist...",
  "categoriesList": ["Person", "Science", "History"]
}
```

### 6.2 Archive / Unlimited Pool
- Same structure as daily, but stored in a larger JSON array, indexed by date or slug.  
- Unlimited mode randomly selects from a curated set of ~2000+ articles of varying difficulty.

---

## 7. Detailed Feature Specifications

### 7.1 Lumen Hint System
- **Trigger:** A small lightbulb icon in the UI; initially greyed out. After reaching guess thresholds, it glows and shows the hint level(s) available.
- **Hints:**
  - **Level 1 (50 guesses):** Reveals “First letter: C”.
  - **Level 2 (80 guesses):** Shows “Category: Person – Science”.
  - **Level 3 (120 guesses):** Unredacts the sample sentence in the article (only the sentence, without revealing the title).
- **Opt-in:** Player must click to reveal. Using a hint is recorded in `hintsUsed` and reflected in the final score line (e.g., “💡1”).
- **Edge case:** If player guesses the title before a threshold, hints never appear for that round.

### 7.2 Title Flexibility (“Almost!” Recognition)
- **Definition:** `alternateTitles` list contains common short forms, last names, or widely used designations (e.g., “World War II” might have “WW2”, “WWII”, “Second World War”).
- **Behaviour:** When the input word matches any alternate title (case-insensitive):
  - Do **not** mark the game as solved.
  - Show a non-intrusive toast message: “You’ve uncovered the subject! Try the full title now.”
  - The guess still reveals the word in the text if it exists.
  - This help is permanent and does not count as a hint.
- **Edge case:** If the alternate title is already the article title (shouldn’t happen; duplicate prevention). 

### 7.3 Daily Difficulty Badge
- **Display:** A coloured badge next to the date:
  - 🔵 Straightforward (popular articles with < 5000 words, high page view rank)
  - 🟡 Challenging (moderately known, 5000-15000 words)
  - 🔴 Obscure (niche, low popularity, >15000 words)
- **Determination:** Pre-computed using Wikipedia page view statistics and article length. Stored in puzzle JSON as `difficulty`.
- **Unlimited mode filter:** Dropdown to select difficulty or “All” before starting a new practice game.

### 7.4 Post-Solve Reading Nudge
- **Win screen sequence:**
  1. Title is entered → a brief animation (redaction bars dissolve).
  2. Screen transitions to a clean overlay with:
     - A pull quote: the first 1-2 sentences of the article (which are now revealed).
     - Large button: “Read the Full Article”.
     - Secondary button: “Share Result”.
     - Close (X) button to return to the fully revealed article.
  3. If “Read the Full Article” is clicked, the overlay disappears, leaving the entire article beautifully rendered with subtle typography, and the title at the top as an H1. No further game interaction.
- **Accessibility:** Focus is managed; screen readers announce the pull quote.

### 7.5 Archive Mode
- **Access:** From hamburger menu → “Archive”. A calendar or list of past daily puzzles (starting from launch date).
- **Each entry** shows date, difficulty badge, and whether the user has played it (locally stored flag).
- **Behaviour:** Selecting a past puzzle loads that game state as a new session. The share text includes “Archived” marker. Does not update daily streak counter (stored separately).
- **Data:** Archive puzzles are identical in structure; stored as static files keyed by date.

### 7.6 Smart Reveal Streaks
- **Implementation:** Each token has a `pos` (part-of-speech) tag. When rendered, if the token is revealed and the feature is enabled (toggle in settings, off by default), apply a subtle background or text colour:
  - Nouns (NN, NNP): soft blue highlight
  - Verbs (VB, VBD, VBG): soft green
  - Numbers (CD): soft purple
  - Adjectives/Adverbs: soft orange
- **Purpose:** Helps players quickly parse sentence structure without altering the challenge.
- **Performance:** Purely CSS class assignment; no runtime overhead.

### 7.7 Accessibility
- **WCAG 2.1 AA** compliant.
- All redacted blocks have `aria-label="redacted word"` or `role="presentation"` depending on context.
- Revealed words are standard text.
- Input field is clearly labelled; keyboard shortcut (Enter) to guess.
- Focus trapping in modals (post-solve, archive).
- Screen reader announcements for: “Word revealed: evolution”, “Hint available: First letter C”, “Almost! Try the full title.”
- High contrast mode forced by OS settings, or toggle within game.

---

## 8. Scoring & Sharing

- **Score line:** Emoji grid representing guesses and accuracy.
  - Columns: guess number (each guess a square) or a simplified representation.
  - 🟩 = guess was a correct word reveal (but not title)
  - 🟨 = hint used at that guess (if hint was taken)
  - 🏆 = final title guess
  - 💡N = number of Lumen hints used
  - Example: `Unredact #42 7/12 🟩🟩🟩🟩🟩🟩🏆 💡1`
- **Words revealed %:** Shown below the grid.
- **Share button:** Copies the text representation to clipboard with a link to the game.

---

## 9. Development Phases (Suggested)

1. **MVP – Core Loop**
   - Static daily puzzle rendering, guessing, redaction, win detection, scoring.
   - Basic UI with dark mode only, no hints, no archive.
   - Single daily puzzle with hardcoded JSON.
2. **Feature Build-out**
   - Lumen hint system.
   - Title flexibility.
   - Difficulty badges and unlimited mode with filters.
   - Post-solve nudge and “Read Full Article” flow.
   - Light mode.
3. **Archive & Polish**
   - Archive navigation, past puzzle loader.
   - Smart Reveal Streaks (optional).
   - Accessibility pass.
   - Analytics (opt-in, privacy-friendly).
4. **Launch & Content Pipeline**
   - Admin script to scrape/prepare daily articles, schedule them.
   - CDN deployment, domain setup.
   - Community sharing integration.

---

## 10. Admin / Content Pipeline

- **Daily puzzle generation script:**
  1. Fetch a random or curated Wikipedia article via API (e.g., `https://en.wikipedia.org/api/rest_v1/page/random/summary` to get title, then fetch full HTML).
  2. Parse and clean text (remove tables, references, see-also sections, keep main content).
  3. Tokenize, identify stop words, apply POS tagging.
  4. Define alternate titles (manual step or automatic: e.g., title without parenthetical, commonly known short name from Wikidata).
  5. Set difficulty based on page view data (dumps or API).
  6. Generate sample sentence (first non-title sentence of intro).
  7. Output JSON, store in a version-controlled repository.
- **Scheduling:** A cron job runs daily, pushes the JSON for the next day to the static host. For unlimited mode, a large batch is pre-generated.

---

## 11. Performance & Non-Functional Requirements

- **Load time:** Initial puzzle JSON < 50 KB (average article tokens). Lazy load archive files.
- **Rendering:** Redacted article can contain thousands of tokens; use virtualised rendering if needed (though modern DOM should handle up to ~10k nodes smoothly). Consider rendering as a single text node with spans.
- **Offline support:** Service worker to cache the daily puzzle and app shell, enabling play without network (sans article reading).
- **Privacy:** No PII collected. Anonymous, aggregated stats via a self-hosted Plausible or Cloudflare Analytics.

---

## 12. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Obscure articles frustrate users | Difficulty badge + Lumen hints + Unlimited mode filters |
| Exact title too hard to guess | Title flexibility nudge |
| Copyright of Wikipedia text | All content is Creative Commons (BY-SA); attribution included in footer. |
| Backend cost | Keep fully static; no servers needed. |

---

**End of Specification**