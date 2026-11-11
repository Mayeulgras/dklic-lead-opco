/**
 * Budget formation annuel estimé, sur le modèle des simulateurs concurrents
 * (Matchers, Mon Budget OPCO, MonBudgetFormation…) : un seul chiffre, le plafond
 * annuel que l'OPCO accorde au plan de développement des compétences d'une
 * entreprise de cette taille.
 *
 * C'est un ordre de grandeur pour ouvrir la conversation, pas un devis : le
 * gérant affine au téléphone. Voir `Cadrage_Calcul_Financement_OPCO.md`.
 *
 * Chiffres relevés en septembre 2026, à réviser une fois par an. Chaque OPCO
 * publie par branche : la valeur retenue est celle d'une branche représentative
 * de ses TPE-PME.
 */

import type { Taille } from "./effectif"
import type { OpcoId } from "./opcos"

type Plafonds = Record<Exclude<Taille, "plus50">, number>

export const PLAFONDS_ANNUELS: Record<OpcoId, Plafonds> = {
  AFDAS: { moins11: 1_100, de11a49: 1_800 }, // critères 2026
  AKTO: { moins11: 4_500, de11a49: 5_600 }, // règles de prise en charge 2026
  ATLAS: { moins11: 8_000, de11a49: 8_000 }, // panorama OGMA 2026
  // Constructys ne publie pas de budget national (« contactez vos interlocuteurs
  // en région ») : 3 500 € vient d'une source secondaire, le reste est estimé.
  CONSTRUCTYS: { moins11: 3_500, de11a49: 5_000 },
  OCAPIAT: { moins11: 3_000, de11a49: 5_000 }, // estimé, plafond publié par stagiaire (1 500 €)
  OPCOMMERCE: { moins11: 2_000, de11a49: 4_000 }, // IDCC 2216, commerce de détail
  OPCO_2I: { moins11: 6_000, de11a49: 6_000 }, // moins de 50 salariés
  OPCO_EP: { moins11: 4_200, de11a49: 4_200 }, // branche coiffure (IDCC 2596)
  OPCO_MOBILITES: { moins11: 1_500, de11a49: 1_800 }, // Services de l'automobile 2026
  OPCO_SANTE: { moins11: 2_500, de11a49: 2_500 }, // source secondaire
  UNIFORMATION: { moins11: 5_000, de11a49: 5_000 }, // moins de 50 salariés
}

/**
 * Ce qu'on peut annoncer au visiteur :
 * - `montant` : l'OPCO est connu, on donne son plafond ;
 * - `fourchette` : aucune convention déclarée, on donne l'écart entre tous les
 *   OPCO plutôt qu'une moyenne — une moyenne ressemblerait à un chiffre précis
 *   et pourrait même coïncider avec le plafond d'un OPCO réel ;
 * - `surEtude` : au-delà de 50 salariés, le financement se décide projet par
 *   projet, il n'y a pas d'enveloppe à annoncer.
 */
export type Budget =
  | { type: "montant"; montant: number }
  | { type: "fourchette"; min: number; max: number }
  | { type: "surEtude" }

export function budgetAnnuel(opco: OpcoId | null, taille: Taille): Budget {
  if (taille === "plus50") return { type: "surEtude" }
  if (opco) return { type: "montant", montant: PLAFONDS_ANNUELS[opco][taille] }

  const valeurs = Object.values(PLAFONDS_ANNUELS).map((p) => p[taille])
  return { type: "fourchette", min: Math.min(...valeurs), max: Math.max(...valeurs) }
}

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

/**
 * Le budget tel qu'il est annoncé, à l'écran comme dans le mail et la fiche
 * Odoo : le conseiller voit exactement ce que le visiteur a vu.
 */
export function formaterBudget(budget: Budget): string {
  if (budget.type === "surEtude") return "Sur étude"
  if (budget.type === "montant") return euros.format(budget.montant)
  return `${euros.format(budget.min)} – ${euros.format(budget.max)}`
}
