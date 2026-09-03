/**
 * Barèmes de prise en charge. Toutes les valeurs monétaires du projet vivent
 * ici : il n'existe aucun barème national unique, chaque OPCO publie sa grille
 * et la révise chaque année. Ce fichier est donc à réviser annuellement.
 *
 * Chiffres relevés le 2026-09-03 — sources dans
 * `Cadrage_Calcul_Financement_OPCO.md` §2 et §6.
 */

/** Journée de formation standard retenue par le client : 7 heures. */
export const HEURES_PAR_JOUR = 7

/** Durées proposées dans le simulateur, en jours. */
export const DUREES_JOURS = [1, 2, 3] as const

/** Bornes pédagogiques du groupe, fixées par le client. */
export const APPRENANTS_MIN = 5
export const APPRENANTS_MAX = 12

export interface Bareme {
  /** Forfait horaire pris en charge, par heure et par stagiaire. */
  forfaitHoraire: number
  /** Plafond par journée de 7 h, toutes personnes confondues. `null` si aucun. */
  plafondJournalier: number | null
  /** Plafond annuel par entreprise. `null` si aucun. */
  plafondAnnuel: number | null
  /** Les frais annexes (transport, repas, hébergement) sont-ils pris en charge ? */
  fraisAnnexes: boolean
  source: string
}

/**
 * Barème par défaut, utilisé tant que l'OPCO n'est pas identifié.
 *
 * Les 30 €/h viennent du client. Ils sont un milieu de fourchette défendable
 * (constaté : 13 à 60 €/h selon la branche) mais légèrement optimistes. Le
 * plafond journalier de 2 000 € est celui d'Uniformation : sans lui, la grille
 * du client afficherait 2 520 € pour une journée à 12 apprenants, au-dessus de
 * ce qui serait réellement financé.
 */
export const BAREME_DEFAUT: Bareme = {
  forfaitHoraire: 30,
  plafondJournalier: 2_000,
  plafondAnnuel: 5_000,
  fraisAnnexes: true,
  source: "Moyenne indicative — barème client, écrêté sur les plafonds constatés",
}

/**
 * Barèmes réellement publiés, relevés sur les sites des OPCO. Volontairement
 * incomplet : on ne renseigne que ce qui a été vérifié, le reste retombe sur
 * `BAREME_DEFAUT`. Mieux vaut une fourchette assumée qu'un chiffre inventé.
 */
export const BAREMES_PAR_OPCO: Record<string, Bareme> = {
  Uniformation: {
    forfaitHoraire: 18, // 15 € OPCO + 3 € de cofinancement de branche
    plafondJournalier: 2_000,
    plafondAnnuel: 5_000,
    fraisAnnexes: true,
    source: "Uniformation — financement du plan de développement des compétences",
  },
  "OPCO Atlas": {
    forfaitHoraire: 40, // branche bureaux d'études (Syntec), 150 h max par action
    plafondJournalier: null,
    plafondAnnuel: null,
    fraisAnnexes: true,
    source: "Opco Atlas — critères de financement bureaux d'études",
  },
  AKTO: {
    forfaitHoraire: 30,
    plafondJournalier: null,
    plafondAnnuel: null,
    fraisAnnexes: true,
    source: "AKTO — règles de prise en charge 2026 (plafond 60 €/h inter-entreprises)",
  },
  OPCOMMERCE: {
    forfaitHoraire: 30,
    plafondJournalier: null,
    plafondAnnuel: 4_000,
    fraisAnnexes: false,
    source: "OPCOMMERCE IDCC 2216 — plafond annuel par salarié, 11-49 salariés",
  },
}

export function baremePourOpco(opco: string | null): Bareme {
  if (!opco) return BAREME_DEFAUT

  return BAREMES_PAR_OPCO[opco] ?? BAREME_DEFAUT
}

/**
 * Majoration appliquée quand l'entreprise dépose un dossier accompagné.
 *
 * Le client demandait « +10 % parce qu'un plan de formation précis serait
 * accepté ». Aucun mécanisme ne fonctionne ainsi : la modulation de ±20 %
 * évoquée est décidée par la branche sur le NPEC, qui relève de l'apprentissage.
 * On garde l'ordre de grandeur mais on le rattache aux frais annexes et
 * dispositifs complémentaires (Pro-A, FNE-Formation), qui sont des gisements
 * réels — et qui sont précisément ce qu'un accompagnement au montage de dossier
 * permet d'aller chercher.
 *
 * N'est donc proposée que si le barème de l'OPCO couvre les frais annexes.
 */
export const TAUX_ACCOMPAGNEMENT = 0.1
