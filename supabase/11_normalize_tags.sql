-- Extension pour supprimer les accents
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Fonction de normalisation d'un tag (équivalent de normalizeTag JS)
CREATE OR REPLACE FUNCTION normalize_tag(tag TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE STRICT
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Minuscules + suppression des accents
  result := lower(unaccent(trim(tag)));
  -- Remplace tout sauf lettres/chiffres par un tiret
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  -- Fusionne les tirets consécutifs
  result := regexp_replace(result, '-+', '-', 'g');
  -- Retire les tirets en début et fin
  result := regexp_replace(result, '^-|-$', '', 'g');
  RETURN result;
END;
$$;

-- Correction de tous les tags existants
UPDATE articles
SET tags = (
  SELECT array_agg(normalized) FILTER (WHERE normalized <> '')
  FROM (
    SELECT normalize_tag(unnest(tags)) AS normalized
  ) sub
)
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;
