/**
 * Interprétation du champ `tranche_effectif_salarie` de l'API Recherche
 * d'entreprises. Voir `Cadrage_Calcul_Financement_OPCO.md` §4.
 *
 * L'API renvoie un code INSEE (TEFEN), pas un nombre. Attention : l'effectif du
 * *siège* vaut très souvent `NN` alors que celui de l'*entreprise* est renseigné
 * (vérifié sur Danone : siège `NN`, racine `42`) — on lit donc le champ racine.
 */

export interface TrancheEffectif {
  code: string
  min: number
  /** `null` pour la tranche ouverte (10 000 salariés et plus). */
  max: number | null
  libelle: string
}

const TRANCHES: Record<string, TrancheEffectif> = {
  "00": { code: "00", min: 0, max: 0, libelle: "Aucun salarié" },
  "01": { code: "01", min: 1, max: 2, libelle: "1 à 2 salariés" },
  "02": { code: "02", min: 3, max: 5, libelle: "3 à 5 salariés" },
  "03": { code: "03", min: 6, max: 9, libelle: "6 à 9 salariés" },
  "11": { code: "11", min: 10, max: 19, libelle: "10 à 19 salariés" },
  "12": { code: "12", min: 20, max: 49, libelle: "20 à 49 salariés" },
  "21": { code: "21", min: 50, max: 99, libelle: "50 à 99 salariés" },
  "22": { code: "22", min: 100, max: 199, libelle: "100 à 199 salariés" },
  "31": { code: "31", min: 200, max: 249, libelle: "200 à 249 salariés" },
  "32": { code: "32", min: 250, max: 499, libelle: "250 à 499 salariés" },
  "41": { code: "41", min: 500, max: 999, libelle: "500 à 999 salariés" },
  "42": { code: "42", min: 1_000, max: 1_999, libelle: "1 000 à 1 999 salariés" },
  "51": { code: "51", min: 2_000, max: 4_999, libelle: "2 000 à 4 999 salariés" },
  "52": { code: "52", min: 5_000, max: 9_999, libelle: "5 000 à 9 999 salariés" },
  "53": { code: "53", min: 10_000, max: null, libelle: "10 000 salariés et plus" },
}

/**
 * `NN` (non employeur ou effectif inconnu) et tout code non répertorié
 * retournent `null` : l'appelant doit alors demander l'effectif à l'utilisateur
 * plutôt que de deviner. C'est un cas fréquent, pas une anomalie.
 */
export function parseTrancheEffectif(code: string | null): TrancheEffectif | null {
  if (!code) return null

  return TRANCHES[code] ?? null
}

/** Seuil d'accès aux fonds mutualisés France Compétences (cadrage §2). */
export const SEUIL_FONDS_MUTUALISES = 50

/**
 * Le seuil des 50 salariés coïncide exactement avec la frontière entre les codes
 * `12` (20-49) et `21` (50-99) : l'éligibilité est donc déterminable sans
 * ambiguïté, contrairement au seuil de 11 salariés qui tombe à l'intérieur du
 * code `11` (10-19) et reste indécidable depuis l'API seule.
 */
export function eligibleFondsMutualises(tranche: TrancheEffectif): boolean {
  return tranche.min < SEUIL_FONDS_MUTUALISES
}
