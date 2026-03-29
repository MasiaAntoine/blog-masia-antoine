-- ============================================================
-- Blog Masia Antoine — Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
-- Liée à auth.users via trigger automatique
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles visibles par tous"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Auteur peut modifier son profil"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── Articles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  slug        TEXT NOT NULL UNIQUE,
  content     TEXT NOT NULL DEFAULT '',
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  tags        TEXT[] NOT NULL DEFAULT '{}',
  cover       TEXT,
  published   BOOLEAN NOT NULL DEFAULT FALSE,
  -- product : { title, description, url, image, cta? }
  product     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Articles publiés visibles par tous ; brouillons visibles seulement par l'auteur
CREATE POLICY "Articles publiés visibles par tous"
  ON articles FOR SELECT
  USING (published = TRUE OR auth.uid() = author_id);

CREATE POLICY "Auteur peut créer ses articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Auteur peut modifier ses articles"
  ON articles FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Auteur peut supprimer ses articles"
  ON articles FOR DELETE
  USING (auth.uid() = author_id);

-- ── Trigger : créer le profil à la création d'un user ────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Trigger : mettre à jour updated_at automatiquement ───────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── Index ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS articles_slug_idx       ON articles (slug);
CREATE INDEX IF NOT EXISTS articles_author_id_idx  ON articles (author_id);
CREATE INDEX IF NOT EXISTS articles_published_idx  ON articles (published);
CREATE INDEX IF NOT EXISTS articles_date_idx       ON articles (date DESC);

-- ============================================================
-- SETUP INVITE-ONLY
-- Dans Supabase Dashboard : Auth > Settings
-- → Désactiver "Enable email signups"
-- → Pour ajouter un co-auteur : Auth > Users > "Invite user"
-- ============================================================
