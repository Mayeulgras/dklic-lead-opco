/**
 * Détermination de l'OPCO de rattachement à partir de l'IDCC de l'entreprise.
 *
 * La spec prévoyait l'API CFADock ; celle-ci est passée derrière une clé
 * développeur réservée aux CFA. On s'en passe : l'API Recherche d'entreprises
 * que l'on interroge déjà renvoie l'IDCC dans `complements.liste_idcc`, et la
 * correspondance IDCC -> OPCO est dérivée de la table officielle de France
 * Compétences (voir `scripts/generer-table-idcc.mjs`). Aucun appel réseau
 * supplémentaire, aucune clé, aucun quota.
 */

import { IDCC_PAR_OPCO } from "./idcc-opco"
import type { OpcoId } from "./opcos"

/** Index inversé, construit une fois au chargement du module. */
const OPCO_PAR_IDCC = new Map<string, OpcoId>()

for (const [opco, idccs] of Object.entries(IDCC_PAR_OPCO)) {
  for (const idcc of idccs) OPCO_PAR_IDCC.set(idcc, opco as OpcoId)
}

/**
 * Valeurs d'échappement de la nomenclature : « hors convention » (9999) ou
 * « convention non déterminée » (9998, 0000). Elles ne désignent aucune branche
 * et ne doivent jamais servir à choisir un OPCO.
 */
const IDCC_NEUTRES = new Set(["0000", "9998", "9999"])

/**
 * Normalise un IDCC sur 4 chiffres : l'API le renvoie tantôt « 1486 », tantôt
 * « 01486 ». Les zéros de tête sont retirés avant le remplissage, sinon un
 * code déjà trop long ressortirait inchangé (`padStart` ne tronque pas).
 */
function normaliser(idcc: string): string {
  const chiffres = idcc.replace(/\D/g, "").replace(/^0+/, "")
  return chiffres.padStart(4, "0")
}

/**
 * Retourne l'OPCO correspondant, ou `null` si l'entreprise n'a pas de
 * convention exploitable — cas fréquent, à traiter comme tel dans l'interface
 * plutôt qu'en devinant un forfait.
 */
export function resoudreOpco(listeIdcc: string[] | null | undefined): OpcoId | null {
  if (!listeIdcc?.length) return null

  for (const brut of listeIdcc) {
    const idcc = normaliser(brut)
    if (!idcc || IDCC_NEUTRES.has(idcc)) continue

    const opco = OPCO_PAR_IDCC.get(idcc)
    if (opco) return opco
  }

  return null
}

/** Nombre d'IDCC couverts — utile aux tests et au diagnostic. */
export const NB_IDCC_COUVERTS = OPCO_PAR_IDCC.size
