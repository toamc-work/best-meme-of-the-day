# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev`: Start live development server (runs `devvit playtest`)
- `npm run build`: Compile client and server via Vite
- `npm run deploy`: Type-check + lint + upload to Reddit (`devvit upload`)
- `npm run type-check`: Run `tsc --build` across all tsconfig files
- `npm run lint`: ESLint over `src/**/*.{ts,tsx}`
- `npm run prettier`: Format all files
- `npm run login`: Authenticate CLI with Reddit

Dev subreddit: `meme_of_the_day_dev`

## Architecture

This is a **Devvit web app** — a Reddit-embedded application running inside an iFrame. It uses Devvit's web-only API (never `@devvit/public-api` or blocks).

### Three-layer split

| Layer | Location | Runtime |
|---|---|---|
| Client | `src/client/` | Browser iFrame on reddit.com |
| Server | `src/server/` | Serverless Node.js 22 on Devvit |
| Shared types | `src/shared/` | Both |

### Server (`src/server/`)

Hono app with two route groups:
- `/api/*` — public endpoints called from the client (REST, typed via `src/shared/api.ts`)
- `/internal/*` — Devvit platform callbacks (menu actions, form submits, triggers)

Access `redis`, `reddit`, and `context` only from server code via `@devvit/web/server`.

### Client (`src/client/`)

Two React entry points, each backed by an HTML file registered in `devvit.json`:
- `splash.html` / `splash.tsx` — **Inline view** shown in the Reddit feed. Keep it lightweight.
- `game.html` / `game.tsx` — **Expanded view** launched when the user taps in.

Use `navigateTo` (not `window.location`) and `showToast`/`showForm` (not `window.alert`) from `@devvit/web/client`.

### Adding new entrypoints or menu items

Every new HTML entry point must be registered in `devvit.json` under `post.entrypoints`. Every new menu item endpoint must have a corresponding entry in `devvit.json` under `menu.items`.

### Build output

Vite compiles to `dist/client/` (static assets) and `dist/server/index.cjs`. Paths are referenced by `devvit.json`.

## Code Style

- Prefer type aliases over interfaces
- Prefer named exports over default exports
- Never cast TypeScript types
