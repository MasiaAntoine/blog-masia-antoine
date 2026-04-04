-- Couleur personnalisée pour les miniatures (par auteur)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cover_color TEXT DEFAULT '#0f172a';
