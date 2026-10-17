<div align="center">

# Ignite Frontend

The web dashboard for the Ignite Discord bots: control music playback, send text-to-speech, and fire the soundboard — from any browser.

Built with **Next.js 16.4 + React 19**, glassmorphism UI, Discord login through Supabase Auth, and a **BFF** (server-side proxies) that talks to the `ignite-music` and `ignite-sound` REST APIs so their secrets never reach the browser.

</div>

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Requirements](#requirements)
4. [Setup (step by step)](#setup-step-by-step)
5. [Settings (environment variables)](#settings-environment-variables)
6. [Database (Supabase)](#database-supabase)
7. [The BFF (what the browser actually calls)](#the-bff-what-the-browser-actually-calls)
8. [Project structure](#project-structure)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [License](#license)

---

## Features

| | |
| --- | --- |
| **Music controller** | Song catalog, universal search with suggestions, YouTube / Spotify link support, play-next, persistent floating player bar (play, pause, skip, previous, seek scrubber, volume, loop, shuffle, autoplay, audio filters), and a queue drawer (jump to track, remove, clear) |
| **Playlists** | Import a playlist link, save it per user in Supabase, browse the live track listing (synced on open) and play it back from the web or from Discord with `/playlists` |
| **Favorites** | Per-user favorite songs and playlists in Supabase, importable from any playlist with one click |
| **TTS console** | Message composer with character counter, neural voice picker, rate/pitch controls, browser preview, one-click emit to the Discord voice channel, and saved phrases in Supabase |
| **Soundboard** | Live catalog from the sound bot, scope/category filters + search, emoji picker, one-click play in Discord, upload of new sounds and edit/delete |
| **Discord context** | Login with Discord (Supabase Auth), server (guild) selector, voice-presence banner, and per-guild control |
| **Design** | Glassmorphism panels, dark/light mode with persistence, responsive mobile + desktop, toast notifications |

---

## Tech stack

- **Next.js 16.4** (App Router, Turbopack, Cache Components) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **lucide-react** icons, with an in-house glass UI kit (`components/ui/`)
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) for auth and data
- **BFF route handlers** in `app/api/music/[...path]` and `app/api/sound/[...path]` that inject secrets server-side
- **Vitest** for unit tests

---

## Requirements

- **Node.js 22.12+** (LTS from <https://nodejs.org>)
- A running **ignite-music** API and, for the TTS/soundboard tabs, a running **ignite-sound** API
- A **Supabase** project (auth, favorites, playlists, phrases)
- A **Discord application** with OAuth2, configured as a Supabase Auth provider

---

## Setup (step by step)

### 1. Install Node.js

Download and install the **LTS** version from **<https://nodejs.org>** (22.12 or newer). Then close and reopen your terminal.

### 2. Download the project

```bash
git clone https://github.com/DeibydBarragan/ignite-frontend.git
cd ignite-frontend
npm install
```

### 3. Configure Discord login (via Supabase Auth)

1. In the Discord developer portal (**<https://discord.com/developers/applications>**), create or pick your application and copy the **Client ID** and **Client Secret** from the OAuth2 page.
2. Add this redirect URL in the Discord OAuth2 settings (this is the Supabase callback, not the app):
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In the Supabase dashboard, go to **Authentication → Providers → Discord**, enable it and paste the Client ID / Secret.
4. In **Authentication → URL Configuration**, set the Site URL and add the app redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain/auth/callback`

### 4. Create the database tables

In the Supabase SQL editor, create (or verify) the tables listed in [Database (Supabase)](#database-supabase), then apply the RLS lockdown migration:

```bash
supabase/migrations/001_lockdown_rls.sql
```

### 5. Configure the environment

Copy `.env.example` to `.env.local` and fill it in (see the [table below](#settings-environment-variables)):

```bash
cp .env.example .env.local
```

```env
# Public (baked into the client bundle)
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DEFAULT_GUILD_ID=your_discord_server_id   # optional

# Server-only (never prefix with NEXT_PUBLIC_)
IGNITE_API_SECRET=the_same_secret_as_the_music_bot
IGNITE_API_URL=https://your-music-bot-api             # fallback if bot_status doesn't announce one
SOUND_API_URL=https://your-sound-bot-api
```

### 6. Run it

```bash
npm run dev        # local dev at http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest run
```

On first load, log in with Discord, pick a server, and join a voice channel in Discord to enable playback controls.

---

## Settings (environment variables)

| Variable | Scope | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key |
| `NEXT_PUBLIC_DEFAULT_GUILD_ID` | public, optional | Server preselected on first load |
| `NEXT_PUBLIC_USE_MOCKS` | public, optional | `"true"` in dev to use local fixtures instead of live data |
| `IGNITE_API_SECRET` | **server-only** | Shared secret injected by the music BFF as `Authorization: Bearer …`; must match the bot's `API_SECRET` (min 16 chars; legacy name `API_SECRET` is also read) |
| `IGNITE_API_URL` | **server-only** | Base URL of the music bot, used when the `bot_status` table doesn't announce a fresh one |
| `SOUND_API_URL` | **server-only** | Base URL of the sound bot (TTS + soundboard) |

> `NEXT_PUBLIC_*` vars are inlined into the client bundle at build time — rebuild/redeploy after changing them. Everything else stays on the server: the browser only calls the local `/api/*` proxies.
>
> Legacy names (`NEXT_PUBLIC_IGNITE_API_URL`, `NEXT_PUBLIC_SOUND_API_URL`, `NEXT_PUBLIC_IGNITE_API_SECRET`) are still read server-side as fallbacks, but they are deprecated — use the server-only vars.

`DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` are **not used by the app** anymore: Discord OAuth is handled entirely by Supabase Auth (see step 3).

---

## Database (Supabase)

Tables used by this app (schema is shared with the bots — see their repos for the authoritative DDL):

| Table | Used for |
| --- | --- |
| `user_playlists` | Saved user playlists (also read by the music bot's `/playlists` command) |
| `user_favorites` | Favorite songs, including playlist-imports (`is_lyric` column is optional — the app retries without it when missing) |
| `saved_phrases` | Saved TTS phrases |
| `bot_status` | `id` + `api_url` + `updated_at`; when the music row is fresh (< 10 min), the BFF uses it to discover the music bot URL automatically |

Example for `user_playlists`:

```sql
create table if not exists user_playlists (
  id text primary key,
  user_id text not null,
  name text not null,
  source text not null default 'spotify',
  url text not null,
  cover text,
  tracks jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);
```

The app also caches playlists in `localStorage` (key `ignite_v2_user_playlists`) so the UI keeps working when Supabase is unreachable. All local storage keys are versioned and centralized in `lib/storage-keys.ts`.

---

## The BFF (what the browser actually calls)

The browser never talks to the bots directly. It calls two local proxies:

- **`/api/music/[...path]`** — forwards to the music bot's `/api/*`, injecting `Authorization: Bearer <IGNITE_API_SECRET>` and the caller's `x-user-discord-id`. The bot base URL is auto-discovered via `bot_status` (fresh rows only) and falls back to `IGNITE_API_URL`. Returns `502` when the bot is unreachable.
- **`/api/sound/[...path]`** — forwards to `SOUND_API_URL` `/api/*`. Injects the bearer token when configured, and passes binary responses through (TTS previews return `audio/*`).

All upstream calls use `cache: "no-store"`, preserve the upstream status code, and never expose secrets to the client.

---

## Project structure

```text
app/
  page.tsx                    Tab shell (music / TTS / soundboard) + floating player
  layout.tsx                  Root layout, metadata
  globals.css                 Glass design tokens + Tailwind `dark` variant (class-based)
  auth/callback/route.ts      Supabase OAuth code exchange (PKCE)
  api/music/[...path]/route.ts   BFF proxy → ignite-music
  api/sound/[...path]/route.ts   BFF proxy → ignite-sound
components/
  app-nav.tsx                 Logo, bot status, Discord profile, theme toggle
  context-toolbar.tsx         Tab switcher + guild/voice indicators
  music/                      music-view, player-bar (+ transport/track-info/fx),
                              queue-drawer (+ item/now-playing), playlists-view
                              (+ card/detail/fav modals/toolbar), song-card, …
  tts/                        tts-view, composer, saved phrases, recent activity
  soundboard/                 soundboard-view, sound-pad, toolbar, activity feed,
                              emoji picker, add/edit/delete modals
  phrase-to-sound/            Keyword → sound triggers
  ui/                         In-house button + toast
context/                      Providers: bot, auth, live-events, player-state,
                              soundboard, tts, favorites
hooks/                        Data + behavior hooks (playback, queue, playlists,
                              voices, live search, recommendations, storage, …)
lib/
  http.ts / logger.ts / env.ts      Cross-cutting utilities (Zod-validated requests)
  ignite-api.ts / sound-api.ts      REST clients (call the BFF, not the bots)
  playlists-service.ts / favorites-service.ts / phrases-service.ts
  server/upstream.ts                Server-only: base URLs + secret resolution
  schemas/                          Zod schemas for every upstream response
  supabase/                         Browser + server Supabase clients
types/                        Domain, player and auth types
tests/                        Vitest unit tests (run with `npm test`)
supabase/migrations/          SQL migrations (apply 001_lockdown_rls.sql)
public/ignite.svg             Ignite logo
```

---

## Deployment

The easiest target is **Vercel**:

1. Import the repo at <https://vercel.com/new>.
2. Set the [environment variables](#settings-environment-variables) in the project settings (production + preview). Remember: `IGNITE_API_SECRET`, `IGNITE_API_URL` and `SOUND_API_URL` are server-only; `NEXT_PUBLIC_*` only the Supabase ones.
3. Add `https://your-domain/auth/callback` to the Supabase Auth redirect URLs.
4. Deploy. Every push to `main` redeploys automatically.

Any Node host works too (`npm run build` + `npm start`), as long as the env vars above are set.

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Login loops back to the login screen | Check the Discord provider config in Supabase (step 3) and that `…/auth/callback` is in the Supabase redirect allowlist |
| "Música OFFLINE" badge / `502` from `/api/music/*` | The music bot is unreachable: verify `IGNITE_API_URL`, that the bot is running, and that `bot_status.api_url` isn't stale |
| Favorites fail with `42703` (column does not exist) | The `user_favorites` table lacks `is_lyric`; the app falls back automatically. Add the column if you want to persist lyric videos |
| "Not connected to a voice channel" banner | Join a voice channel in Discord first — playback and TTS need a target channel |
| TTS/soundboard not working | Check `SOUND_API_URL` — the sound bot must be online |
| Playlists don't reach the database | Verify `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, the tables and the RLS migration; the UI still works locally via `localStorage` meanwhile |
| Light/dark theme suddenly looks broken | Don't remove the `@custom-variant dark` line in `app/globals.css` — it keeps Tailwind's `dark:*` tied to the `.dark` class instead of the OS preference |
| Changed an env var but nothing happened | `NEXT_PUBLIC_*` vars are inlined at build time; server vars need a restart/redeploy |
| Anything else | Open devtools console/network: the BFF preserves upstream status codes and logs failures via `lib/logger.ts` |

---

## License

All rights reserved unless a `LICENSE` file in this repo states otherwise. The Ignite music bot it controls is MIT-licensed — see [ignite-music](https://github.com/DeibydBarragan/ignite-music).
