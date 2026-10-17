-- Fase 0.4 — Lockdown RLS: cerrar políticas `using (true)` y exigir auth.uid() = user_id.
-- Ejecutar en el dashboard SQL de Supabase. Idempotente y reversible en staging.

-- user_favorites
alter table if exists public.user_favorites enable row level security;
drop policy if exists "users manage own favorites" on public.user_favorites;
drop policy if exists "users manage own favorites (open)" on public.user_favorites;
create policy "users manage own favorites"
  on public.user_favorites for all
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- user_playlists
alter table if exists public.user_playlists enable row level security;
drop policy if exists "users manage own playlists" on public.user_playlists;
drop policy if exists "users manage own playlists (open)" on public.user_playlists;
create policy "users manage own playlists"
  on public.user_playlists for all
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- saved_phrases
alter table if exists public.saved_phrases enable row level security;
drop policy if exists "users manage own phrases" on public.saved_phrases;
drop policy if exists "users manage own phrases (open)" on public.saved_phrases;
create policy "users manage own phrases"
  on public.saved_phrases for all
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- bot_status: solo lectura para anon/authenticated, escritura solo service_role.
alter table if exists public.bot_status enable row level security;
drop policy if exists "bot_status public read" on public.bot_status;
create policy "bot_status public read"
  on public.bot_status for select
  to anon, authenticated
  using (true);
-- Sin política de insert/update/delete para anon/authenticated => denegado por defecto.
-- El bot actualiza vía service_role (bypassa RLS).

-- Índices para paginación y filtros por usuario
create index if not exists user_favorites_user_created_idx
  on public.user_favorites (user_id, created_at desc);
create unique index if not exists user_playlists_user_url
  on public.user_playlists (user_id, url);
create index if not exists saved_phrases_user_created_idx
  on public.saved_phrases (user_id, created_at desc);
