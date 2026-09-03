/**
 * Moteur d'estimation du financement OPCO.
 *
 * Ce module est pur : aucune dépendance réseau, React ou Next. Il est le seul
 * endroit où le montant affiché à l'utilisateur est décidé.
 *
 * Ce qu'il calcule : le **coût d'une action de formation**, donc ce que l'OPCO
 * rembourserait. Ce n'est pas un solde de compte disponible — il n'en existe
 * pas. Voir `Cadrage_Calcul_Financement_OPCO.md`.
 */

import {
  APPRENANTS_MAX,
  APPRENANTS_MIN,
  HEURES_PAR_JOUR,
  TAUX_ACCOMPAGNEMENT,
  baremePourOpco,
  type Bareme,
} from "./baremes"
import {
  eligibleFondsMutualises,
  parseTrancheEffectif,
  type TrancheEffectif,
} from "./effectif"

export interface ParametresSimulation {
  /** 1, 2 ou 3 jours. */
  jours: number
  /** Nombre de personnes formées, borné par la taille de l'entreprise. */
  apprenants: number
}

export interface Estimation {
  /** Montant écrêté, effectivement finançable. */
  montant: number
  /** Montant avant application des plafonds — sert à expliquer l'écrêtage. */
  montantBrut: number
  /** Gain supplémentaire estimé avec un dossier accompagné, `null` si non applicable. */
  bonusAccompagnement: number | null
  /** Renseigné dès qu'un plafond a mordu, pour pouvoir l'afficher honnêtement. */
  plafondApplique: "journalier" | "annuel" | null
  bareme: Bareme
}

export interface ContexteEntreprise {
  tranche: TrancheEffectif | null
  /** `false` au-delà de 50 salariés : plus d'accès aux fonds mutualisés. */
  eligibleFondsMutualises: boolean
  /** Plus grand groupe réalisable compte tenu de l'effectif. */
  apprenantsMax: number
  apprenantsMin: number
  /** `true` quand l'effectif est inconnu (`NN`) et doit être demandé. */
  effectifInconnu: boolean
}

/**
 * Détermine ce que la taille de l'entreprise autorise.
 *
 * L'effectif **plafonne le groupe et conditionne l'éligibilité, il ne multiplie
 * jamais le montant** : le pot est mutualisé (aucun droit proportionnel à
 * l'effectif) et les plafonds annuels l'interdisent mécaniquement. Multiplier
 * ferait afficher plusieurs millions d'euros à un groupe de 10 000 salariés.
 */
export function analyserEntreprise(codeTrancheEffectif: string | null): ContexteEntreprise {
  const tranche = parseTrancheEffectif(codeTrancheEffectif)

  if (!tranche) {
    return {
      tranche: null,
      eligibleFondsMutualises: true,
      apprenantsMax: APPRENANTS_MAX,
      apprenantsMin: APPRENANTS_MIN,
      effectifInconnu: true,
    }
  }

  // On borne sur le haut de la tranche : une entreprise en « 6 à 9 salariés »
  // peut réunir jusqu'à 9 personnes. Rester sur le bas sous-estimerait l'offre.
  const plafondGroupe = tranche.max ?? APPRENANTS_MAX
  const apprenantsMax = Math.max(1, Math.min(APPRENANTS_MAX, plafondGroupe))

  return {
    tranche,
    eligibleFondsMutualises: eligibleFondsMutualises(tranche),
    apprenantsMax,
    // Les très petites structures ne peuvent pas atteindre le plancher de 5 ;
    // on descend le plancher plutôt que d'afficher une fourchette impossible.
    apprenantsMin: Math.min(APPRENANTS_MIN, apprenantsMax),
    effectifInconnu: false,
  }
}

/**
 * Applique la formule du client — `forfait × 7 h × jours × apprenants` — puis
 * **écrête sur les plafonds**. L'écrêtage n'est pas cosmétique : la grille du
 * client culmine à 7 560 €, au-dessus du plafond annuel de plusieurs OPCO réels.
 * Sans lui, l'outil promettrait un montant que le commercial devrait démentir.
 */
export function estimer(
  params: ParametresSimulation,
  opco: string | null
): Estimation {
  const bareme = baremePourOpco(opco)
  const jours = Math.max(1, Math.round(params.jours))
  const apprenants = Math.max(1, Math.round(params.apprenants))

  const coutJournalier = bareme.forfaitHoraire * HEURES_PAR_JOUR * apprenants
  const montantBrut = coutJournalier * jours

  let montant = montantBrut
  let plafondApplique: Estimation["plafondApplique"] = null

  if (bareme.plafondJournalier !== null && coutJournalier > bareme.plafondJournalier) {
    montant = bareme.plafondJournalier * jours
    plafondApplique = "journalier"
  }

  if (bareme.plafondAnnuel !== null && montant > bareme.plafondAnnuel) {
    montant = bareme.plafondAnnuel
    plafondApplique = "annuel"
  }

  // Le bonus n'a de sens que si le barème couvre les frais annexes : c'est là
  // que le gisement se trouve, pas dans une prime à la qualité du dossier.
  const bonusAccompagnement = bareme.fraisAnnexes
    ? Math.round(montant * TAUX_ACCOMPAGNEMENT)
    : null

  return {
    montant: Math.round(montant),
    montantBrut: Math.round(montantBrut),
    bonusAccompagnement,
    plafondApplique,
    bareme,
  }
}

/**
 * Fourchette affichée par défaut à l'arrivée sur le résultat, avant que
 * l'utilisateur ne manipule les curseurs.
 */
export function fourchette(
  contexte: ContexteEntreprise,
  jours: number,
  opco: string | null
): { min: number; max: number } {
  return {
    min: estimer({ jours, apprenants: contexte.apprenantsMin }, opco).montant,
    max: estimer({ jours, apprenants: contexte.apprenantsMax }, opco).montant,
  }
}
