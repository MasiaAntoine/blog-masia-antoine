-- ─────────────────────────────────────────────────────────
-- Migration : ajout de la colonne city
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ─────────────────────────────────────────────────────────

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS page_views_city_idx ON page_views(city);
