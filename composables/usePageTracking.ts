/**
 * Composable de tracking des vues d'articles.
 *
 * Design clé : le viewId est généré côté client AVANT tout appel réseau.
 * Cela permet d'envoyer le beacon de durée même si le visiteur quitte la page
 * avant que la réponse du POST /api/track soit arrivée.
 */
export function usePageTracking(articleId: string) {
  // Généré immédiatement — pas d'attente async
  const viewId = import.meta.client
    ? (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
    : null

  const startTime = Date.now()
  let durationSent = false

  function getOrCreateSessionId(): string {
    const key = 'blog_session_id'
    let id = sessionStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
      sessionStorage.setItem(key, id)
    }
    return id
  }

  function getReferrerDomain(referrer: string): string {
    if (!referrer) return 'direct'
    try {
      const hostname = new URL(referrer).hostname.replace(/^www\./, '')
      if (/google\./i.test(hostname)) return 'google.com'
      if (/bing\./i.test(hostname)) return 'bing.com'
      if (/duckduckgo\./i.test(hostname)) return 'duckduckgo.com'
      if (/twitter\.com|t\.co/i.test(hostname)) return 'twitter.com'
      if (/x\.com/i.test(hostname)) return 'x.com'
      if (/facebook\./i.test(hostname)) return 'facebook.com'
      if (/linkedin\./i.test(hostname)) return 'linkedin.com'
      if (/reddit\./i.test(hostname)) return 'reddit.com'
      if (/youtube\./i.test(hostname)) return 'youtube.com'
      return hostname
    }
    catch {
      return 'other'
    }
  }

  function sendDuration() {
    if (durationSent || !viewId) return
    const duration = Math.round((Date.now() - startTime) / 1000)
    if (duration < 2) return
    durationSent = true
    // sendBeacon fonctionne même quand la page est en cours de déchargement
    navigator.sendBeacon(
      '/api/track/duration',
      new Blob(
        [JSON.stringify({ view_id: viewId, duration_seconds: duration })],
        { type: 'application/json' },
      ),
    )
  }

  onMounted(() => {
    if (!viewId) return

    const sessionId = getOrCreateSessionId()
    const referrer = document.referrer
    const referrerDomain = getReferrerDomain(referrer)

    // Fire-and-forget : on n'attend PAS la réponse avant d'être prêt à envoyer
    // le beacon, car viewId est déjà connu
    $fetch('/api/track', {
      method: 'POST',
      body: {
        view_id: viewId,
        article_id: articleId,
        session_id: sessionId,
        referrer,
        referrer_domain: referrerDomain,
      },
    }).catch(() => {})

    // Fermeture d'onglet / passage en arrière-plan (mobile inclus)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendDuration()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Fermeture / rechargement de la page (desktop)
    window.addEventListener('beforeunload', sendDuration)

    onBeforeUnmount(() => {
      // Navigation Nuxt interne (SPA)
      sendDuration()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('beforeunload', sendDuration)
    })
  })
}
