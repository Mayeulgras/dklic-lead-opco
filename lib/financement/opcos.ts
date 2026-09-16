/**
 * Les onze opérateurs de compétences, tels que nommés dans la table SIRET-OPCO
 * de France Compétences. L'identifiant interne sert de clé partout (barèmes,
 * table IDCC) ; le libellé est ce que voit l'utilisateur.
 */
export const OPCOS = {
  AFDAS: "Afdas",
  AKTO: "AKTO",
  ATLAS: "OPCO Atlas",
  CONSTRUCTYS: "Constructys",
  OCAPIAT: "OCAPIAT",
  OPCOMMERCE: "L'Opcommerce",
  OPCO_2I: "OPCO 2i",
  OPCO_EP: "OPCO EP",
  OPCO_MOBILITES: "OPCO Mobilités",
  OPCO_SANTE: "OPCO Santé",
  UNIFORMATION: "Uniformation",
} as const

export type OpcoId = keyof typeof OPCOS

export function libelleOpco(id: OpcoId): string {
  return OPCOS[id]
}
