import "server-only"

/**
 * Client minimal de l'API externe d'Odoo 19 (« JSON-2 ») : chaque appel est un
 * POST sur `/json/2/<modèle>/<méthode>`, authentifié par une clé API, avec les
 * arguments nommés dans un objet JSON. Chaque appel est sa propre transaction.
 *
 * Les anciennes API XML-RPC / JSON-RPC sont annoncées comme supprimées (Odoo
 * Online 21.1) : ne pas y revenir.
 * https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
 */

export interface ConfigOdoo {
  /** Adresse de l'instance, sans `/` final (https://dklic-formations.odoo.com). */
  url: string
  /** Clé API d'un utilisateur Odoo. Elle expire au plus tard au bout de 3 mois. */
  cleApi: string
  /** Base de données, seulement si le serveur en héberge plusieurs. */
  base?: string
  /** Utilisateur Odoo (commercial) à qui attribuer les opportunités. */
  commercialId?: number
}

/** Lit la configuration dans l'environnement ; `null` tant qu'elle est incomplète. */
export function configOdoo(env: Record<string, string | undefined> = process.env): ConfigOdoo | null {
  const url = env.ODOO_URL?.trim().replace(/\/+$/, "")
  const cleApi = env.ODOO_API_KEY?.trim()
  if (!url || !cleApi) return null

  const commercialId = Number(env.ODOO_COMMERCIAL_ID)

  return {
    url,
    cleApi,
    base: env.ODOO_DB?.trim() || undefined,
    commercialId: Number.isInteger(commercialId) && commercialId > 0 ? commercialId : undefined,
  }
}

export class ErreurOdoo extends Error {
  constructor(
    message: string,
    readonly statut?: number
  ) {
    super(message)
    this.name = "ErreurOdoo"
  }
}

export type AppelOdoo = <T = unknown>(
  modele: string,
  methode: string,
  parametres?: Record<string, unknown>
) => Promise<T>

/** Au-delà, on considère Odoo comme indisponible plutôt que de faire attendre le visiteur. */
const DELAI_MS = 10_000

/** Traduit les refus d'Odoo en message lisible dans les journaux et le mail. */
function messageErreur(statut: number, corps: string, appel: string): string {
  let detail = corps.slice(0, 300)
  try {
    const json = JSON.parse(corps) as { message?: string }
    if (json.message) detail = json.message
  } catch {
    // Corps non JSON (page d'erreur d'un proxy) : on garde le début du texte.
  }

  if (statut === 401) return `Clé API Odoo refusée, expirée ou révoquée ? (${detail})`
  if (statut === 403) return `Droits Odoo insuffisants pour ${appel} (${detail})`
  if (statut === 404) return `Méthode ou modèle Odoo introuvable : ${appel} (${detail})`
  return `Odoo a répondu ${statut} sur ${appel} : ${detail}`
}

export function clientOdoo(config: ConfigOdoo, fetchImpl: typeof fetch = fetch): AppelOdoo {
  return async <T,>(modele: string, methode: string, parametres: Record<string, unknown> = {}) => {
    const appel = `${modele}/${methode}`
    let reponse: Response

    try {
      reponse = await fetchImpl(`${config.url}/json/2/${appel}`, {
        method: "POST",
        headers: {
          Authorization: `bearer ${config.cleApi}`,
          "Content-Type": "application/json; charset=utf-8",
          "User-Agent": "dklic-simulateur-opco",
          ...(config.base ? { "X-Odoo-Database": config.base } : {}),
        },
        body: JSON.stringify(parametres),
        signal: AbortSignal.timeout(DELAI_MS),
      })
    } catch (erreur) {
      const raison = erreur instanceof Error ? erreur.message : String(erreur)
      throw new ErreurOdoo(`Odoo injoignable (${appel}) : ${raison}`)
    }

    const corps = await reponse.text()

    if (!reponse.ok) {
      throw new ErreurOdoo(messageErreur(reponse.status, corps, appel), reponse.status)
    }

    try {
      return JSON.parse(corps) as T
    } catch {
      throw new ErreurOdoo(`Réponse illisible d'Odoo sur ${appel}`)
    }
  }
}
