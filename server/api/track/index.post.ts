import { serverSupabaseClient } from '#supabase/server'

// ── Détection OS depuis le User-Agent ──────────────────────
function detectOs(ua: string): string {
  if (!ua) return 'Inconnu'
  if (/iPad/i.test(ua)) return 'iOS'
  if (/iPhone/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows NT/i.test(ua)) return 'Windows'
  if (/CrOS/i.test(ua)) return 'ChromeOS'
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac'
  if (/Ubuntu/i.test(ua)) return 'Ubuntu'
  if (/Linux/i.test(ua)) return 'Linux'
  return 'Autre'
}

// ── Détection type d'appareil ──────────────────────────────
function detectDevice(ua: string): string {
  if (!ua) return 'Inconnu'
  if (/iPad/i.test(ua)) return 'Tablet'
  if (/iPhone|Android.*Mobile|Mobile.*Android|Windows Phone|BlackBerry|IEMobile/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as {
    view_id?: string
    article_id?: string
    session_id?: string
    referrer?: string
    referrer_domain?: string
  }

  const { view_id, article_id, session_id, referrer, referrer_domain } = body

  if (!article_id || !session_id) {
    throw createError({ statusCode: 400, message: 'article_id et session_id sont requis.' })
  }

  // ── Lecture des en-têtes serveur ───────────────────────────
  const ua = getHeader(event, 'user-agent') ?? ''

  // Pays : Vercel injecte x-vercel-ip-country, Cloudflare injecte cf-ipcountry
  const countryCode = getHeader(event, 'x-vercel-ip-country')
    ?? getHeader(event, 'cf-ipcountry')
    ?? null

  // Convertir le code ISO en nom lisible (ex: "FR" → "France")
  const validCountryCode = (countryCode && countryCode !== 'XX') ? countryCode.toUpperCase().slice(0, 2) : null
  let country: string | null = null
  if (validCountryCode) {
    try {
      const dn = new Intl.DisplayNames(['fr'], { type: 'region' })
      country = dn.of(validCountryCode) ?? validCountryCode
    }
    catch {
      country = validCountryCode
    }
  }

  // Ville : Vercel injecte x-vercel-ip-city (URL-encodée, ex: "Saint-Étienne" → "Saint-%C3%89tienne")
  let city: string | null = null
  const rawCity = getHeader(event, 'x-vercel-ip-city') ?? null
  if (rawCity) {
    try {
      city = decodeURIComponent(rawCity)
    }
    catch {
      city = rawCity
    }
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client
    .from('page_views')
    .insert({
      // Utilise l'ID généré côté client si fourni — permet au beacon de durée
      // de référencer la bonne ligne sans attendre la réponse du serveur
      ...(view_id ? { id: view_id } : {}),
      article_id,
      session_id,
      referrer: referrer ?? null,
      referrer_domain: referrer_domain ?? null,
      os: detectOs(ua),
      device_type: detectDevice(ua),
      country,
      country_code: validCountryCode,
      city,
      user_agent: ua || null,
    })
    .select('id')
    .single()

  if (error) {
    // Silent fail — le tracking ne doit jamais bloquer l'utilisateur
    return { id: null }
  }

  return { id: data.id }
})
