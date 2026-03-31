-- ─────────────────────────────────────────────────────────
-- Table : page_views
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS page_views (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id       UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  session_id       TEXT        NOT NULL,
  referrer         TEXT,
  referrer_domain  TEXT,
  duration_seconds INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index composite pour les requêtes de stats (article + période)
CREATE INDEX IF NOT EXISTS page_views_article_created_idx
  ON page_views(article_id, created_at DESC);

-- Index pour la mise à jour de durée par session
CREATE INDEX IF NOT EXISTS page_views_session_idx
  ON page_views(session_id);

-- ─── Row Level Security ────────────────────────────────────
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Tout le monde (y compris anon) peut enregistrer une vue
CREATE POLICY "insert_page_view"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- La durée ne peut être mise à jour que si elle n'a pas encore été définie
-- (évite les mises à jour malveillantes répétées)
CREATE POLICY "update_duration_once"
  ON page_views FOR UPDATE
  USING (duration_seconds = 0);

-- Seuls les auteurs peuvent lire les stats de leurs propres articles
CREATE POLICY "author_select_stats"
  ON page_views FOR SELECT
  USING (
    article_id IN (
      SELECT id FROM articles WHERE author_id = auth.uid()
    )
  );
