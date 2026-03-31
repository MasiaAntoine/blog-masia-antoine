-- ─────────────────────────────────────────────────────────
-- Table : product_clicks
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_clicks (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID        NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  session_id TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_clicks_article_created_idx
  ON product_clicks(article_id, created_at DESC);

ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;

-- Tout visiteur peut enregistrer un clic
CREATE POLICY "insert_product_click"
  ON product_clicks FOR INSERT
  WITH CHECK (true);

-- Seul l'auteur de l'article peut consulter ses clics
CREATE POLICY "author_select_clicks"
  ON product_clicks FOR SELECT
  USING (
    article_id IN (
      SELECT id FROM articles WHERE author_id = auth.uid()
    )
  );
