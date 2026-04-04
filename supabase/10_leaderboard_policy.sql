-- Permettre à tout utilisateur authentifié de lire les page_views
-- pour le calcul du classement (leaderboard).
-- Les page_views ne contiennent pas de données personnelles identifiables.
CREATE POLICY "authenticated_read_views" ON page_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Idem pour product_clicks
CREATE POLICY "authenticated_read_clicks" ON product_clicks
  FOR SELECT
  TO authenticated
  USING (true);
