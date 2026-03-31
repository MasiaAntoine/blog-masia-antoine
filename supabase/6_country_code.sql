-- Ajout du code ISO pays (ex: "FR", "US") pour générer les drapeaux côté frontend
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS country_code CHAR(2);
CREATE INDEX IF NOT EXISTS page_views_country_code_idx ON page_views(country_code);
