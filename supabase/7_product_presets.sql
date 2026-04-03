-- Placements produit pré-définis (suggestions réutilisables par auteur)
CREATE TABLE IF NOT EXISTS product_placement_presets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  url         TEXT        NOT NULL,
  image       TEXT        NOT NULL DEFAULT '',
  cta         TEXT        NOT NULL DEFAULT 'Voir sur Amazon',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS product_presets_author_idx ON product_placement_presets(author_id);

ALTER TABLE product_placement_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "author_select_presets" ON product_placement_presets
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "author_insert_presets" ON product_placement_presets
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "author_delete_presets" ON product_placement_presets
  FOR DELETE USING (auth.uid() = author_id);
