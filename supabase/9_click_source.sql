-- Distinguer les clics article (placement bas de page) vs sidebar (menu "Sur cette page")
ALTER TABLE product_clicks
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'article';

CREATE INDEX IF NOT EXISTS product_clicks_source_idx ON product_clicks(source);
