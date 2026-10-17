<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ignite-frontend — Agent & Contributor Guide

Frontend for **Ignite** (Discord bot): music, TTS and soundboard. Next.js 16.4 (App Router, Turbopack, Cache Components) + React 19 + Tailwind v4 + Supabase (auth and data) + a BFF in front of the bots.

## Commands

- `npm run dev` — local server at http://localhost:3000 (requires `.env.local`).
- `npm run lint` / `npm run typecheck` / `npm test` — mandatory gates before considering any change done.
- Tests: Vitest in `tests/*.test.ts`. Add tests for new pure logic in `lib/`.

## Architecture

- **UI → BFF → bots.** The browser only calls local routes `/api/music/[...path]` and `/api/sound/[...path]` (proxies that inject secrets server-side). Never call the bots directly from the client.
- **Secrets:** server-side only (`IGNITE_API_SECRET`, `DISCORD_CLIENT_SECRET`, etc.). `NEXT_PUBLIC_*` holds only the Supabase URL and anon key. Never commit `.env.local`.
- **Contexts:** `BotProvider` composes Auth → LiveEvents → PlayerState → Soundboard → TTS → Favorites. Components consume context hooks; data logic lives in `hooks/` and `lib/*-service.ts`.
- **HTTP:** use `lib/http.ts` (`httpRequest` with Zod schema, timeout, `no-store`). Schemas in `lib/schemas/`. Logging via `lib/logger.ts`, never `console.*` directly.
- **In-house UI kit:** `components/ui/button.tsx`, `GlassModal`, `GlassSelect`, `useToast`. heroUI was removed: do not reintroduce it.
- **Language:** UI copy, comments and error messages must be in Spanish.
- **Cache Components is enabled** in `next.config.ts`: keep Suspense/cache in mind when adding pages.

## Code Rules

- Files ≤ 250 lines; public interfaces ≤ 20 members. When splitting a file: preserve the public import path and exact behavior (classes, conditions, render order).
- Zero `any` (enforced by lint).
- `react-hooks/set-state-in-effect` is an error: no synchronous `setState` inside `useEffect`. Valid patterns: async callbacks with a `cancelled` flag, `useMounted`, `useSyncExternalStore`, module-level cache.
- Dark theme is driven by the `.dark` **class** on `<html>` (`ThemeToggle`). The variant is declared in `app/globals.css`:
  `@custom-variant dark (&:where(.dark, .dark *));`
  Do not remove that line (Tailwind's `dark:*` would fall back to `prefers-color-scheme` and the light/dark theme would break).
- Supabase: tables may lag behind the code. Use `select` with fallbacks for missing columns (see `lib/favorites-service.ts`: retry without `is_lyric` on error `42703`) and never break when a new column does not exist.
- Migrations live in `supabase/migrations/`. Apply `001_lockdown_rls.sql` to the remote project (pending).
- Local persistence keys are centralized in `lib/storage-keys.ts`.

## Workflow

1. Before coding, read the relevant Next.js guide in `node_modules/next/dist/docs/` (this version has breaking changes).
2. UI changes: verify them in `npm run dev` in both light **and** dark theme.
3. Before closing any change: `npm run typecheck` + `npm run lint` + `npm test` must be green.
4. Do not commit or push unless explicitly asked. Operational to-dos (secret rotation, RLS migration, deploy variables) never go into the repo.
