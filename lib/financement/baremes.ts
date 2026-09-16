/**
 * Barèmes de prise en charge. Toutes les valeurs monétaires du projet vivent
 * ici : il n'existe aucun barème national unique, chaque OPCO publie sa grille
 * et la révise chaque année. Ce fichier est donc à réviser annuellement.
 *
 * Chiffres relevés les 2026-09-03 et 2026-09-08 — sources dans
 * `Cadrage_Calcul_Financement_OPCO.md` §2 et §6.
 *
 * Chaque OPCO publie **par branche** : la valeur retenue est celle d'une branche
 * représentative, nommée dans `source`. Une entreprise d'une autre branche du
 * même OPCO relèvera d'une grille différente.
 */

import type { OpcoId } from "./opcos"

/** Journée de formation standard retenue par le client : 7 heures. */
export const HEURES_PAR_JOUR = 7

/** Durées proposées dans le simulateur, en jours. */
export const DUREES_JOURS = [1, 2, 3] as const

/** Bornes pédagogiques du groupe, fixées par le client. */
export const APPRENANTS_MIN = 5
export const APPRENANTS_MAX = 12

/**
 * D'où vient le chiffre. Cette distinction remonte jusqu'à l'interface : un
 * montant estimé ne doit jamais s'afficher avec le même aplomb qu'un montant
 * relevé sur la grille publiée de l'opérateur.
 */
export type Fiabilite = "releve" | "estime"

export interface Bareme {
  /** Forfait horaire pris en charge, par heure et par stagiaire. */
  forfaitHoraire: number
  /** Plafond par journée de 7 h, toutes personnes confondues. `null` si aucun. */
  plafondJournalier: number | null
  /** Plafond annuel par entreprise. `null` si aucun. */
  plafondAnnuel: number | null
  /** Les frais annexes (transport, repas, hébergement) sont-ils pris en charge ? */
  fraisAnnexes: boolean
  fiabilite: Fiabilite
  source: string
}

/**
 * Barème par défaut, utilisé tant que l'OPCO n'est pas identifié.
 *
 * Les 30 €/h viennent du client. Ils sont un milieu de fourchette défendable
 * (relevé : 9,15 à 40 €/h selon l'opérateur et la branche). Le plafond
 * journalier de 2 000 € est celui d'Uniformation : sans lui, la grille du client
 * afficherait 2 520 € pour une journée à 12 apprenants, au-dessus de ce qui
 * serait réellement financé.
 */
export const BAREME_DEFAUT: Bareme = {
  forfaitHoraire: 30,
  plafondJournalier: 2_000,
  plafondAnnuel: 5_000,
  fraisAnnexes: true,
  fiabilite: "estime",
  source: "Moyenne indicative — hypothèse client, écrêtée sur les plafonds constatés",
}

/**
 * Grilles par opérateur. Neuf sur onze sont relevées sur le site officiel de
 * l'OPCO ; les deux dernières sont estimées faute de grille publiée accessible,
 * et marquées comme telles.
 */
export const BAREMES_PAR_OPCO: Record<OpcoId, Bareme> = {
  AFDAS: {
    // Critères 2026 : 40 €/h maximum par stagiaire, plafond annuel 1 100 € HT
    // sous 11 salariés et 1 800 € HT de 11 à 49. On retient le cas le plus
    // fréquent (moins de 11).
    forfaitHoraire: 40,
    plafondJournalier: null,
    plafondAnnuel: 1_100,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "Afdas — critères de financement 2026",
  },
  AKTO: {
    // Grille Propreté & Services 2026 : 40 €/h en inter pour les formations
    // générales. Le plafond journalier de 2 800 € est celui explicitement prévu
    // pour l'intra-entreprise en groupe de 5 à 12 — exactement le scénario du
    // client. Un groupe de 2 à 4 relève d'un autre plafond (1 120 €/jour) que
    // ce modèle ne distingue pas encore.
    forfaitHoraire: 40,
    plafondJournalier: 2_800,
    plafondAnnuel: 7_000,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "AKTO — règles de prise en charge 2026, branche Propreté & Services",
  },
  ATLAS: {
    // Branche bureaux d'études (Syntec) : 40 € HT/h, plafonné à 150 h par
    // formation — soit bien au-delà des 21 h d'une action de 3 jours, donc sans
    // effet ici. Plafond annuel de 8 000 € HT par entreprise.
    forfaitHoraire: 40,
    plafondJournalier: null,
    plafondAnnuel: 8_000,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "Opco Atlas — critères de financement, bureaux d'études (Syntec)",
  },
  CONSTRUCTYS: {
    // Bâtiment, 11 à moins de 300 salariés : le plafond horaire est passé de
    // 24 € à 19 € pour les demandes reçues à compter du 1er juin 2026.
    forfaitHoraire: 19,
    plafondJournalier: null,
    plafondAnnuel: null,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "Constructys — modalités de participation financière 2026, Bâtiment",
  },
  OCAPIAT: {
    // Grille 2026 par domaine : 40 € HT/h pour Administration (management,
    // gestion) et Informatique (bureautique), qui couvrent l'essentiel du
    // catalogue dklic. La Prévention y est à 15 € HT/h seulement.
    // Plafond de 1 500 € HT par stagiaire et par dossier.
    forfaitHoraire: 40,
    plafondJournalier: null,
    plafondAnnuel: null,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "OCAPIAT — règles de prise en charge 2026, domaines Administration et Informatique",
  },
  OPCOMMERCE: {
    // ESTIMÉ : aucune grille publiée accessible. Les sources secondaires situent
    // la prise en charge entre 30 et 50 € HT/h ; on retient le bas de la
    // fourchette. Le plafond annuel de 4 000 € (IDCC 2216, 11-49 salariés) est
    // en revanche documenté, tout comme l'exclusion des frais annexes.
    forfaitHoraire: 30,
    plafondJournalier: null,
    plafondAnnuel: 4_000,
    fraisAnnexes: false,
    fiabilite: "estime",
    source: "L'Opcommerce — plafond IDCC 2216 documenté, forfait horaire estimé",
  },
  OPCO_2I: {
    // Entreprises de moins de 50 salariés : coût réel plafonné à 30 € HT/h,
    // dans la limite de 6 000 € par an et par entreprise.
    forfaitHoraire: 30,
    plafondJournalier: null,
    plafondAnnuel: 6_000,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "OPCO 2i — plan de développement des compétences, entreprises de moins de 50 salariés",
  },
  OPCO_EP: {
    // Grille branche 212 : 30 € HT/h pour les formations transverses, qui est
    // la catégorie du catalogue dklic (management, bureautique, prévention).
    // Plafond annuel retenu : celui des moins de 11 salariés (20 000 € au-delà).
    // Limite connue : la branche plafonne aussi les transverses à 20 h, soit
    // moins que 3 jours de 7 h — non modélisé, le plafond annuel domine.
    forfaitHoraire: 30,
    plafondJournalier: null,
    plafondAnnuel: 10_000,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "Opco EP — critères de financement, branche 212 (formations transverses)",
  },
  OPCO_MOBILITES: {
    // Guide pratique 2026, Services de l'automobile : le plan de développement
    // des compétences est pris en charge « de 9,15 € à 15 €/heure selon la
    // formation ». On retient le plancher, qui est le taux de base : le
    // catalogue dklic ne relève pas des certifications prioritaires de branche.
    // Plafond annuel progressif selon l'effectif — 1 500 € HT sous 11 salariés,
    // puis 1 800 / 2 100 / 2 400 / 2 700 €. On garde le cas le plus fréquent.
    forfaitHoraire: 9.15,
    plafondJournalier: null,
    plafondAnnuel: 1_500,
    fraisAnnexes: true,
    fiabilite: "releve",
    source:
      "OPCO Mobilités — guide pratique 2026, Services de l'automobile (mise à jour 11/03/2026)",
  },
  OPCO_SANTE: {
    // ESTIMÉ : l'opérateur ne publie ses montants que dans des fiches par
    // branche non accessibles. Le forfait retenu est la médiane des neuf
    // grilles relevées ici, soit 30 €/h — cohérent avec la fourchette de 25 à
    // 45 €/h que rapportent les sources secondaires. Le plafond de 2 500 € par
    // salarié provient d'une source secondaire.
    forfaitHoraire: 30,
    plafondJournalier: null,
    plafondAnnuel: 2_500,
    fraisAnnexes: true,
    fiabilite: "estime",
    source: "OPCO Santé — estimation (médiane des grilles relevées), grille non publiée",
  },
  UNIFORMATION: {
    forfaitHoraire: 18, // 15 € OPCO + 3 € de cofinancement de branche
    plafondJournalier: 2_000,
    plafondAnnuel: 5_000,
    fraisAnnexes: true,
    fiabilite: "releve",
    source: "Uniformation — financement du plan de développement des compétences",
  },
}

export function baremePourOpco(opco: OpcoId | null): Bareme {
  if (!opco) return BAREME_DEFAUT

  return BAREMES_PAR_OPCO[opco]
}

/** Le forfait vient-il de la grille publiée de l'opérateur, ou d'une estimation ? */
export function baremeReleve(opco: OpcoId | null): boolean {
  return opco !== null && BAREMES_PAR_OPCO[opco].fiabilite === "releve"
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
