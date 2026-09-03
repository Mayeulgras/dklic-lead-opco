import { NextRequest, NextResponse } from "next/server"

import {
  companySchema,
  rechercheEntreprisesResponseSchema,
  type Company,
} from "@/lib/schemas/lead-form"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const API_URL = "https://recherche-entreprises.api.gouv.fr/search"

/** L'API DINUM plafonne à 7 req/s ; on reste largement en dessous par client. */
const RATE_LIMIT = { limit: 30, windowMs: 60_000 }

/** Au-delà, on considère l'API tierce comme indisponible plutôt que d'attendre. */
const TIMEOUT_MS = 5_000

/** Les données entreprises bougent peu : une heure de cache par requête. */
const REVALIDATE_S = 3_600

type RawResult = ReturnType<
  typeof rechercheEntreprisesResponseSchema.parse
>["results"][number]

function toCompany(result: RawResult): Company | null {
  const candidate = {
    siren: result.siren,
    siret: result.siege?.siret ?? "",
    nom: result.nom_complet,
    adresse: result.siege?.adresse ?? "",
    codePostal: result.siege?.code_postal ?? "",
    ville: result.siege?.libelle_commune ?? "",
    codeNaf: result.siege?.activite_principale ?? "",
    effectif: result.tranche_effectif_salarie ?? null,
  }

  // Un établissement sans siège exploitable est écarté silencieusement : c'est
  // un résultat de recherche parmi d'autres, pas une erreur de la requête.
  const parsed = companySchema.safeParse(candidate)

  return parsed.success ? parsed.data : null
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const { ok, retryAfter } = rateLimit(clientKey(request), RATE_LIMIT)

  if (!ok) {
    return NextResponse.json(
      { error: "Trop de recherches consécutives, réessayez dans un instant" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const url = new URL(API_URL)
  url.searchParams.set("q", q)
  url.searchParams.set("per_page", "8")

  let res: Response

  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_S },
    })
  } catch (error) {
    // Réseau injoignable, DNS, ou dépassement du timeout : sans ce catch
    // l'exception remonterait en 500 non formaté que le client ne sait pas lire.
    console.error("Recherche d'entreprises injoignable:", error)
    return NextResponse.json(
      { error: "Le service de recherche d'entreprises est momentanément indisponible" },
      { status: 503 }
    )
  }

  if (!res.ok) {
    console.error(`Recherche d'entreprises a répondu ${res.status} ${res.statusText}`)
    return NextResponse.json(
      { error: "Impossible de contacter l'API Recherche d'entreprises" },
      { status: 502 }
    )
  }

  let payload: unknown

  try {
    payload = await res.json()
  } catch (error) {
    console.error("Réponse illisible de Recherche d'entreprises:", error)
    return NextResponse.json(
      { error: "Réponse inattendue du service de recherche d'entreprises" },
      { status: 502 }
    )
  }

  const parsed = rechercheEntreprisesResponseSchema.safeParse(payload)

  if (!parsed.success) {
    console.error("Contrat rompu côté Recherche d'entreprises:", parsed.error.issues)
    return NextResponse.json(
      { error: "Réponse inattendue du service de recherche d'entreprises" },
      { status: 502 }
    )
  }

  const results = parsed.data.results
    .map(toCompany)
    .filter((company): company is Company => company !== null)

  return NextResponse.json({ results })
}
