-- ─────────────────────────────────────────────────────────
-- Migration : ajout des colonnes OS, appareil, pays, user-agent
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ─────────────────────────────────────────────────────────

ALTER TABLE page_views ADD COLUMN IF NOT EXISTS os           TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS device_type  TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS country      TEXT;
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS user_agent   TEXT;

-- Index pour les requêtes de breakdown par OS / appareil / pays
CREATE INDEX IF NOT EXISTS page_views_os_idx      ON page_views(os);
CREATE INDEX IF NOT EXISTS page_views_device_idx  ON page_views(device_type);
CREATE INDEX IF NOT EXISTS page_views_country_idx ON page_views(country);

-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'page_views'
ORDER BY ordinal_position;
