# Unredact

> A daily Wikipedia word puzzle — guess words to reveal a hidden article.

[![CI](https://github.com/your-org/unredact/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/unredact/actions)

## What is Unredact?

Unredact is a faithful recreation of [Redactle](https://redactle.com/) — a daily browser game where you see the full text of a Wikipedia article with every content word blacked out. You guess words to reveal them and try to identify the article. No time limits, no wrong answer penalties, unlimited guesses.

**Three modes:**
- 🗓 **Daily** — One new puzzle per day, synced worldwide
- 📅 **Archive** — Play any past daily puzzle
- ∞ **Unlimited** — Random puzzle, filtered by difficulty

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Language | TypeScript (strict) |
| Build | Vite 8 |
| Styling | TailwindCSS v3 |
| Routing | React Router v6 |
| Testing | Vitest + React Testing Library |
| PWA | vite-plugin-pwa + Workbox |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Project Structure

```
src/
  app/           # Root component, router, routes
  features/
    game/        # Core game engine, components, hooks
    archive/     # Archive mode
    unlimited/   # Unlimited mode
    settings/    # User preferences
    statistics/  # Win/streak tracking
  components/    # Shared UI (Modal, Toast, Header)
  services/      # Puzzle loading, localStorage
  data/          # Stop words list
  styles/        # Global CSS
  types/         # Shared type exports
  test/          # Test setup
public/
  data/
    puzzles/     # Daily puzzle JSON files (YYYY-MM-DD.json)
    archive-index.json
    unlimited-index.json
```

## Adding a New Puzzle

Puzzle files live in `public/data/puzzles/YYYY-MM-DD.json`. Each file must follow the `Puzzle` type in `src/features/game/types/index.ts`.

```json
{
  "id": "2026-07-27",
  "title": "Article Title",
  "normalizedTitle": "article title",
  "alternateTitles": ["alternate", "forms"],
  "category": "Category – Subcategory",
  "difficulty": "straightforward | challenging | obscure",
  "firstLetter": "A",
  "sampleSentence": "A non-title sentence from the intro.",
  "tokens": [...],
  "fullTextRaw": "...",
  "categoriesList": ["Category"]
}
```

After adding:
1. Update `public/data/archive-index.json`
2. Update `public/data/unlimited-index.json`
3. Commit and push — the CI pipeline deploys automatically

## Deployment

### Cloudflare Pages (recommended — free)

1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

### Docker / Self-hosted

```bash
# Build image
docker compose build

# Run
docker compose up -d
```

The `public/data/` directory is mounted as a volume so you can add puzzles without rebuilding the image.

## Configuration

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

## License

MIT — see [LICENSE](LICENSE)
