/**
 * Taille de l'entreprise, déduite du champ `tranche_effectif_salarie` de l'API
 * Recherche d'entreprises.
 *
 * L'API renvoie un code INSEE (TEFEN), pas un nombre. Attention : l'effectif du
 * *siège* vaut très souvent `NN` alors que celui de l'*entreprise* est renseigné
 * (vérifié sur Danone : siège `NN`, racine `42`) — on lit donc le champ racine.
 */

/**
 * Les trois tailles qui changent le budget OPCO : les plafonds diffèrent sous
 * 11 salariés et de 11 à 49, et au-delà de 50 le plan de développement des
 * compétences ne relève plus des fonds mutualisés (financement sur projet).
 */
export type Taille = "moins11" | "de11a49" | "plus50"

export const TAILLES: { id: Taille; libelle: string; court: string }[] = [
  // Libellés courts : ils tiennent sur une ligne dans trois boutons en 390 px.
  { id: "moins11", libelle: "moins de 11 salariés", court: "0 à 10" },
  { id: "de11a49", libelle: "11 à 49 salariés", court: "11 à 49" },
  { id: "plus50", libelle: "50 salariés et plus", court: "50 et +" },
]

export function libelleTaille(taille: Taille): string {
  return TAILLES.find((t) => t.id === taille)!.libelle
}

/** Borne basse de chaque tranche INSEE, en nombre de salariés. */
const MIN_PAR_TRANCHE: Record<string, number> = {
  "00": 0,
  "01": 1,
  "02": 3,
  "03": 6,
  "11": 10,
  "12": 20,
  "21": 50,
  "22": 100,
  "31": 200,
  "32": 250,
  "41": 500,
  "42": 1_000,
  "51": 2_000,
  "52": 5_000,
  "53": 10_000,
}

/**
 * Pré-remplit la taille à partir du code INSEE. Retourne `null` pour `NN`
 * (effectif inconnu, cas fréquent) : le visiteur choisit alors lui-même.
 *
 * La tranche `11` (10 à 19 salariés) chevauche le seuil de 11 : on la range en
 * « 11 à 49 », où tombe l'essentiel de la tranche. Le visiteur peut corriger.
 */
export function tailleDepuisTranche(code: string | null): Taille | null {
  const min = code ? MIN_PAR_TRANCHE[code] : undefined
  if (min === undefined) return null

  if (min >= 50) return "plus50"
  if (min >= 10) return "de11a49"
  return "moins11"
}
