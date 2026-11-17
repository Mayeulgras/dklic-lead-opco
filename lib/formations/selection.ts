/**
 * Les formations du catalogue dklic (produits publiés de la boutique Odoo) et
 * le choix des 3 cartes montrées au visiteur.
 *
 * Deux modes, selon ce que dklic a renseigné dans Odoo :
 * - **par secteurs** (dès qu'au moins une formation est rangée sous
 *   « Secteurs ») : les formations du secteur de l'entreprise, puis celles
 *   marquées « Tous secteurs ». C'est dklic qui dit à qui s'adresse chaque
 *   formation ; une formation sans secteur n'est jamais proposée.
 * - **par pôles**, en attendant : le pôle qui correspond au secteur quand il
 *   n'y a pas de doute, puis des formations des pôles utiles à tous.
 *
 * L'ordre suit le classement « En vedette » de la boutique : dklic choisit
 * depuis Odoo quelles formations passent devant, sans toucher au code.
 */

import { secteurPourNaf, TOUS_SECTEURS, type Secteur } from "./secteurs"

export interface Formation {
  id: number
  nom: string
  /** Première ligne de la description de vente : l'accroche de la carte. */
  accroche: string
  /** Pôles de la boutique (catégories rangées sous « Pôles »). */
  poles: string[]
  /** Secteurs visés (catégories rangées sous « Secteurs »), dont « Tous secteurs ». */
  secteurs: string[]
  /** Page de la formation sur le site dklic. */
  url: string
  image: string
}

export interface Catalogue {
  formations: Formation[]
  /** Page de la boutique qui liste toutes les formations. */
  lienBoutique: string
}

/**
 * Mode « par pôles » uniquement : le pôle de chaque secteur, quand toutes ses
 * formations conviennent au secteur entier. Volontairement prudent : un
 * coiffeur ne verra pas « Massage prénatal » (pôle SPA), ni un garage les
 * chariots élévateurs (pôle Mobilité).
 */
export const POLES_PAR_SECTEUR: Partial<Record<Secteur, string[]>> = {
  "Santé et médico-social": ["Médico-social"],
  "Transport et logistique": ["Mobilité"],
  Commerce: ["Commerce et C.R.T.H."],
  "Hôtellerie et restauration": ["Commerce et C.R.T.H."],
  "Artisanat alimentaire": ["Commerce et C.R.T.H."],
  Numérique: ["Numérique"],
  "Banque, finance et assurance": ["Finance"],
}

/** Mode « par pôles » : pôles utiles à toute entreprise, pour compléter. */
export const POLES_TRANSVERSAUX = [
  "QVCT",
  "Numérique",
  "Management",
  "Gestion d'Entreprise",
  "Finance",
  "Juridique",
  "Qualité et Sécurité",
]

/** Compare des noms de catégories sans tenir compte des accents ni de la casse. */
export function normaliserNom(nom: string): string {
  return nom.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").trim()
}

function dans(valeurs: string[], cherches: string[]): boolean {
  const ensemble = new Set(cherches.map(normaliserNom))
  return valeurs.some((v) => ensemble.has(normaliserNom(v)))
}

/** Odoo est-il renseigné par secteurs ? Sinon, on reste sur les pôles. */
export function modeSecteurs(formations: Formation[]): boolean {
  return formations.some((f) => f.secteurs.length > 0)
}

/**
 * Complète la sélection avec des formations générales en variant les pôles
 * (pas trois formations QVCT d'affilée), puis, si les pôles manquent, dans
 * l'ordre « En vedette ».
 */
function completer(choix: Formation[], candidates: Formation[], nombre: number): Formation[] {
  const restantes = candidates.filter((f) => !choix.includes(f))
  const polesPris = new Set(choix.flatMap((f) => f.poles.map(normaliserNom)))

  for (const f of restantes) {
    if (choix.length >= nombre) break
    if (f.poles.some((p) => polesPris.has(normaliserNom(p)))) continue
    choix.push(f)
    f.poles.forEach((p) => polesPris.add(normaliserNom(p)))
  }

  for (const f of restantes) {
    if (choix.length >= nombre) break
    if (!choix.includes(f)) choix.push(f)
  }

  return choix
}

/** Les cartes à montrer à une entreprise, d'après ses codes NAF (2025 et rév. 2). */
export function choisirFormations(
  formations: Formation[],
  entreprise: { codeNaf: string; codeNaf2025?: string },
  nombre = 3
): Formation[] {
  const secteur = secteurPourNaf(entreprise.codeNaf2025, entreprise.codeNaf)

  if (modeSecteurs(formations)) {
    const ciblees = secteur ? formations.filter((f) => dans(f.secteurs, [secteur])) : []
    const generales = formations.filter((f) => dans(f.secteurs, [TOUS_SECTEURS]))
    return completer(ciblees.slice(0, nombre), generales, nombre)
  }

  const poles = (secteur && POLES_PAR_SECTEUR[secteur]) || []
  const duSecteur = formations.filter((f) => dans(f.poles, poles))
  const transversales = formations.filter((f) => dans(f.poles, POLES_TRANSVERSAUX))
  return completer(duSecteur.slice(0, nombre), transversales, nombre)
}
