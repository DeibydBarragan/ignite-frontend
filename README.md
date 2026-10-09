<div align="center">

# Ignite Frontend

The web dashboard for the Ignite Discord bots: control music playback, send text-to-speech, and fire the soundboard — from any browser.

Built with **Next.js 16 + React 19**, glassmorphism UI, Discord OAuth login, and live state from the `ignite-music` and `ignite-sound` REST APIs.

</div>

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Requirements](#requirements)
4. [Setup (step by step)](#setup-step-by-step)
5. [Settings (environment variables)](#settings-environment-variables)
6. [Backend APIs it talks to](#backend-apis-it-talks-to)
7. [Project structure](#project-structure)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)
10. [License](#license)

---

## Features

| | |
| --- | --- |
| **Music controller** | Song catalog, universal search, YouTube / Spotify / SoundCloud link support, play-next, persistent floating player bar (play, pause, skip, previous, seek scrubber, volume, loop, shuffle, autoplay), and a queue drawer (jump to track, remove, clear) |
| **Playlists** | Import a playlist link (preview resolved tracks first), save it per user in Supabase, and play it back from the web or from Discord with `/playlists` |
| **TTS console** | Message composer with character counter, neural voice picker (Loquendo, Edge es-MX/es-ES/es-AR/es-CO, …), rate/pitch controls, browser preview, one-click emit to the Discord voice channel, and saved phrases in Supabase |
| **Soundboard** | Live catalog from the sound bot, category filters + search, one-click play in Discord, upload of new sounds (name, emoji, category, audio file), and delete |
| **Discord context** | OAuth login, server (guild) selector, voice-presence banner (tells you when you are not in a voice channel), and per-guild control |
| **Design** | Glassmorphism panels, dark/light mode with persistence, responsive mobile + desktop, toast notifications |

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **HeroUI** + **Tailwind CSS 4** + **lucide-react** icons
- **Supabase** (`@supabase/supabase-js`) for saved playlists and phrases
- REST clients in `lib/` for the music bot (`ignite-api.ts`) and the sound bot (`sound-api.ts`), with graceful fallbacks to local mock data when a backend is unreachable

---

## Requirements

- **Node.js 22.12+** (LTS from <https://nodejs.org>)
- A running **ignite-music** API (see its README) and, for the TTS/soundboard tabs, a running **ignite-sound** API
- A **Supabase** project (saved playlists + phrases)
- A **Discord application** with OAuth2 (for web login)

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

### 3. Create the Discord OAuth app (for login)

1. Open **<https://discord.com/developers/applications>** and select (or create) your application.
2. Open the **OAuth2** page and add this redirect URL (replace with your domain in production):
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain/auth/callback`
3. Copy the **Client ID** and **Client Secret** — they go into the env vars below.

### 4. Configure the environment

Copy `.env.example` to `.env.local` and fill it in (see the [table below](#settings-environment-variables)):

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_IGNITE_API_URL=https://your-music-bot-api
NEXT_PUBLIC_IGNITE_API_SECRET=the_same_secret_as_the_music_bot
NEXT_PUBLIC_SOUND_API_URL=https://your-sound-bot-api
NEXT_PUBLIC_DEFAULT_GUILD_ID=your_discord_server_id
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### 5. Run it

```bash
npm run dev      # local dev at http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run lint     # eslint
```

On first load, log in with Discord, pick a server, and join a voice channel in Discord to enable playback controls.

---

## Settings (environment variables)

| Variable | Where | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_IGNITE_API_URL` | public | Base URL of the **ignite-music** REST API (direct URL, Cloudflare Tunnel, or AWS API Gateway) |
| `NEXT_PUBLIC_IGNITE_API_SECRET` | public | Shared secret, must match the music bot's `API_SECRET` (sent as `Authorization: Bearer …`) |
| `NEXT_PUBLIC_SOUND_API_URL` | public | Base URL of the **ignite-sound** REST API (TTS + soundboard) |
| `NEXT_PUBLIC_DEFAULT_GUILD_ID` | public | Server preselected on first load |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL (playlists, phrases) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key |
| `DISCORD_CLIENT_ID` | server-only | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | server-only | Discord OAuth client secret (never prefix with `NEXT_PUBLIC_`) |

> `NEXT_PUBLIC_*` vars are baked into the client bundle at build time — redeploy after changing them. Secrets without that prefix stay on the server.

### Supabase tables

Playlists (also used by the music bot — create once and share):

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

The app also caches playlists in `localStorage` (`ignite_user_playlists`) so the UI keeps working when Supabase is unreachable.

---

## Backend APIs it talks to

### ignite-music (`lib/ignite-api.ts`)

Player state polling, guild list, remote play (`{ query, voiceChannelId?, userId?, next?, skip? }`), transport controls (`pause`, `resume`, `toggle`, `skip`, `previous`, `stop`, `shuffle`, `autoplay`, `volume`, `seek`, `loop`), playlist resolve-by-URL (import preview), and queue remove/clear. All calls send `Authorization: Bearer <secret>`; failures fall back to mock data instead of breaking the UI.

### ignite-sound (`lib/sound-api.ts`)

TTS voices list, TTS browser preview (`POST /api/tts/preview`), TTS emit to voice, soundboard catalog (`GET /api/sounds`), play on Discord (`POST /api/sounds/play`), upload (`POST /api/sounds/upload`), and delete (`DELETE /api/sounds/:id`).

---

## Project structure

```text
app/
  page.tsx                 Tab shell (music / TTS / soundboard) + auth gate + floating player
  layout.tsx               Root layout, metadata, theme provider
  auth/callback/page.tsx   Client-side Discord OAuth callback (token persistence)
  globals.css              Glassmorphism design tokens (glass-panel, glass-input, …)
components/
  app-nav.tsx              Logo, bot status, Discord profile, guild selector
  context-toolbar.tsx      Tab switcher
  voice-banner.tsx         Voice-presence banner
  music/music-view.tsx     Catalog + search + playlists entry
  music/player-bar.tsx     Floating player (transport, seek scrubber, volume)
  music/queue-drawer.tsx   Upcoming queue management
  music/playlists-view.tsx Saved user playlists (import, preview, play)
  music/song-card.tsx      Song card
  tts/tts-view.tsx         TTS composer, voices, history, saved phrases
  soundboard/              Catalog grid, upload modal
  phrase-to-sound/         Keyword → sound triggers
  ui/toast.tsx             Toast notifications
context/bot-context.tsx    Central store: auth, guild, voice, player, triggers
lib/
  ignite-api.ts            Music bot REST client
  sound-api.ts             Sound bot REST client (TTS + soundboard)
  playlists-service.ts     Saved playlists (Supabase + localStorage fallback)
  phrases-service.ts       Saved TTS phrases
  supabase.ts              Supabase client
  mock-data.ts             Catalog/queue fixtures used as fallback
  audio-synth.ts           Web Audio test synth for the soundboard
public/ignite.svg          Ignite logo
```

---

## Deployment

The easiest target is **Vercel**:

1. Import the repo at <https://vercel.com/new>.
2. Set all [environment variables](#settings-environment-variables) in the project settings (production + preview).
3. In the Discord developer portal, add `https://your-domain/auth/callback` to the OAuth2 redirects.
4. Deploy. Every push to `main` redeploys automatically.

Any Node host works too (`npm run build` + `npm start`), as long as the env vars above are set.

---

## Troubleshooting

| Problem | Solution |
| --- | --- |
| Login loops back to the login screen | Check `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET` and that the OAuth2 redirect `…/auth/callback` exactly matches your domain (including `https://`) |
| "Not connected to a voice channel" banner | Join a voice channel in Discord first — playback and TTS need a target channel |
| Player shows mock/empty data | The music API is unreachable: verify `NEXT_PUBLIC_IGNITE_API_URL` is reachable from the browser and `NEXT_PUBLIC_IGNITE_API_SECRET` matches the bot's `API_SECRET` |
| TTS/soundboard not working | Same check for `NEXT_PUBLIC_SOUND_API_URL` — the sound bot must be online |
| Playlists don't persist | Verify `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` and that the `user_playlists` table exists (they still work locally via `localStorage` meanwhile) |
| Changed an env var but nothing happened | `NEXT_PUBLIC_*` vars are inlined at build time — rebuild and redeploy |
| Anything else | Open devtools console/network: API clients fail soft and log the failing endpoint |

---

## License

All rights reserved unless a `LICENSE` file in this repo states otherwise. The Ignite music bot it controls is MIT-licensed — see [ignite-music](https://github.com/DeibydBarragan/ignite-music).
