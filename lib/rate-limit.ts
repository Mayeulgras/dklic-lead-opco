import type { NextRequest } from "next/server"

/**
 * Limiteur de débit à fenêtre fixe, en mémoire.
 *
 * Garde-fou suffisant pour une route publique qui relaie une API tierce : il
 * absorbe les boucles de saisie et les scripts naïfs. En revanche l'état vit
 * dans le processus — sur un hébergement à plusieurs instances (Vercel), la
 * limite s'applique par instance. Passer à un store partagé (Redis/Upstash) si
 * un quota strict devient nécessaire.
 */
interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

/** Empêche la Map de croître indéfiniment sur un processus de longue durée. */
function sweep(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { ok: boolean; retryAfter: number } {
  const now = Date.now()

  if (windows.size > 10_000) sweep(now)

  const current = windows.get(key)

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }

  current.count += 1

  return {
    ok: current.count <= limit,
    retryAfter: Math.ceil((current.resetAt - now) / 1000),
  }
}

/**
 * Identifie l'appelant. `NextRequest.ip` a été supprimé en Next 15, on lit donc
 * les en-têtes posés par le proxy. Retombe sur une clé commune si aucun en-tête
 * n'est présent (dev local) : la limite devient alors globale, ce qui reste le
 * comportement sûr.
 */
export function clientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) return forwardedFor.split(",")[0].trim()

  return request.headers.get("x-real-ip") ?? "unknown"
}
