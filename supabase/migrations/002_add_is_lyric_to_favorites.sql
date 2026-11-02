-- Migration: Add is_lyric column to user_favorites table
ALTER TABLE IF EXISTS public.user_favorites 
ADD COLUMN IF NOT EXISTS is_lyric BOOLEAN DEFAULT FALSE;
