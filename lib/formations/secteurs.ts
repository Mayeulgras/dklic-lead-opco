/**
 * Secteur d'activité d'une entreprise, déduit de son code NAF (le code APE
 * attribué par l'Insee). Les formations dklic sont rattachées à ces mêmes
 * secteurs dans Odoo (catégorie « Secteurs ») : c'est ce qui permet de
 * proposer à chaque entreprise les formations qui la concernent.
 *
 * Deux nomenclatures coexistent : la NAF rév. 2 (codes actuels) et la NAF 2025,
 * obligatoire au 1er janvier 2027. Elles se distinguent par la dernière lettre
 * du code (A à F ou Z pour la rév. 2 ; G, H, J, K, L ou Y pour la NAF 2025).
 */

/** Les secteurs, tels qu'ils doivent être nommés dans Odoo, sous « Secteurs ». */
export const SECTEURS = [
  "Santé et médico-social",
  "Professions de santé",
  "Petite enfance",
  "Industrie",
  "BTP",
  "Transport et logistique",
  "Automobile",
  "Commerce",
  "Hôtellerie et restauration",
  "Artisanat alimentaire",
  "Beauté et bien-être",
  "Sport et loisirs",
  "Numérique",
  "Banque, finance et assurance",
  "Juridique et comptable",
  "Immobilier",
  "Conseil et services aux entreprises",
  "Enseignement et formation",
  "Culture et spectacle",
  "Agriculture",
  "Associations et administrations",
] as const

export type Secteur = (typeof SECTEURS)[number]

/** Catégorie Odoo des formations utiles à toutes les entreprises. */
export const TOUS_SECTEURS = "Tous secteurs"

/**
 * Début du code NAF → secteur, valable pour les deux nomenclatures (la plupart
 * des codes gardent leur début en 2027). Le début le plus long l'emporte ;
 * `null` exclut un code d'un secteur plus large.
 */
export const SECTEUR_PAR_NAF: [prefixeNaf: string, secteur: Secteur | null][] = [
  // Santé et médico-social : hôpitaux, EHPAD et hébergement, aide à domicile,
  // ESAT, action sociale
  ["86.10", "Santé et médico-social"],
  ["87", "Santé et médico-social"],
  ["88.10", "Santé et médico-social"],
  ["88.99", "Santé et médico-social"],
  // Cabinets médicaux et dentaires, paramédical, laboratoires, ambulances
  ["86.2", "Professions de santé"],
  ["86.9", "Professions de santé"],
  // Crèches et accueil de jeunes enfants
  ["88.91", "Petite enfance"],
  // Industrie : extraction, fabrication, énergie, eau et déchets
  ...["05", "06", "07", "08", "09"].map((d): [string, Secteur] => [d, "Industrie"]),
  ...Array.from({ length: 24 }, (_, i): [string, Secteur] => [String(10 + i), "Industrie"]),
  ...["35", "36", "37", "38", "39"].map((d): [string, Secteur] => [d, "Industrie"]),
  // Charcuterie, boulangerie, pâtisserie ; boucheries, poissonneries, boulangeries-magasins
  ["10.13B", "Artisanat alimentaire"],
  ["10.71B", "Artisanat alimentaire"],
  ["10.71C", "Artisanat alimentaire"],
  ["10.71D", "Artisanat alimentaire"],
  ["47.22", "Artisanat alimentaire"],
  ["47.23", "Artisanat alimentaire"],
  ["47.24", "Artisanat alimentaire"],
  // Bâtiment et travaux publics (la promotion immobilière va à l'immobilier)
  ["41", "BTP"],
  ["42", "BTP"],
  ["43", "BTP"],
  ["41.1", "Immobilier"],
  ["68", "Immobilier"],
  // Transport, entreposage, poste et livraison
  ["49", "Transport et logistique"],
  ["50", "Transport et logistique"],
  ["51", "Transport et logistique"],
  ["52", "Transport et logistique"],
  ["53", "Transport et logistique"],
  // Garages, concessions, location de véhicules
  ["45", "Automobile"],
  ["77.1", "Automobile"],
  // Commerce de gros et de détail
  ["46", "Commerce"],
  ["47", "Commerce"],
  // Hôtels, restaurants, cafés, traiteurs
  ["55", "Hôtellerie et restauration"],
  ["56", "Hôtellerie et restauration"],
  // Coiffure, esthétique, spas
  ["96.02", "Beauté et bien-être"],
  ["96.04", "Beauté et bien-être"],
  // Clubs et équipements sportifs, salles de sport, loisirs
  ["93", "Sport et loisirs"],
  ["85.51", "Sport et loisirs"],
  // Logiciels, télécoms, services informatiques
  ["58.2", "Numérique"],
  ["61", "Numérique"],
  ["62", "Numérique"],
  ["63.1", "Numérique"],
  // Banque, assurance (pas les holdings : ce n'est pas un métier)
  ["64", "Banque, finance et assurance"],
  ["65", "Banque, finance et assurance"],
  ["66", "Banque, finance et assurance"],
  ["64.2", null],
  // Avocats, notaires, experts-comptables
  ["69", "Juridique et comptable"],
  // Conseil, ingénierie, publicité, intérim, sécurité, nettoyage, services
  // administratifs (pas les sièges sociaux : ce n'est pas un métier)
  ...["70", "71", "72", "73", "74", "78", "80", "81", "82"].map((d): [string, Secteur] => [
    d,
    "Conseil et services aux entreprises",
  ]),
  ["70.1", null],
  // Écoles et organismes de formation
  ["85", "Enseignement et formation"],
  // Cinéma, audiovisuel, spectacle, patrimoine
  ["59", "Culture et spectacle"],
  ["60", "Culture et spectacle"],
  ["90", "Culture et spectacle"],
  ["91", "Culture et spectacle"],
  // Agriculture, sylviculture, pêche
  ["01", "Agriculture"],
  ["02", "Agriculture"],
  ["03", "Agriculture"],
  // Administrations publiques, associations
  ["84", "Associations et administrations"],
  ["94", "Associations et administrations"],
]

/**
 * Codes NAF 2025 dont le secteur diffère de ce que donnerait le tableau
 * ci-dessus. Établi le 2026-11-17 à partir de la table de correspondance
 * officielle de l'Insee (« Correspondances_NAFrev2-NAF2025.xlsx ») : ce sont
 * les activités qui ont changé de numéro. Appliqué aux seuls codes 2025 (les
 * mêmes débuts désignent autre chose en rév. 2 : 47.81 = marchés alimentaires).
 */
export const CORRECTIONS_NAF_2025: [prefixeNaf: string, secteur: Secteur | null][] = [
  // Charcuterie, boulangerie, pâtisserie avec vente au détail
  ["10.13H", "Artisanat alimentaire"],
  ["10.71H", "Artisanat alimentaire"],
  ["10.71J", "Artisanat alimentaire"],
  // Le commerce et la réparation automobile quittent la division 45
  ["46.71", "Automobile"],
  ["46.72", "Automobile"],
  ["46.73", "Automobile"],
  ["47.81", "Automobile"],
  ["47.82", "Automobile"],
  ["47.83", "Automobile"],
  ["47.92G", "Automobile"],
  ["95.3", "Automobile"],
  // Les crèches rejoignent en partie l'enseignement pré-primaire
  ["85.10", "Petite enfance"],
  // Coiffure, esthétique et spas changent de numéro
  ["96.21", "Beauté et bien-être"],
  ["96.22", "Beauté et bien-être"],
  ["96.23", "Beauté et bien-être"],
]

/** Code NAF 2025 : dernière lettre G, H, J, K, L ou Y (jamais utilisées en rév. 2). */
export function estNaf2025(code: string): boolean {
  return /[GHJKLY]$/.test(code)
}

/** « 8610Z » comme « 86.10Z » : l'annuaire met le point, on ne s'y fie pas. */
function normaliserNaf(code: string): string {
  const brut = code.replace(/\s/g, "").toUpperCase()
  return /^\d{3}/.test(brut) ? `${brut.slice(0, 2)}.${brut.slice(2)}` : brut
}

function chercher(code: string, table: [string, Secteur | null][]): { secteur: Secteur | null } | null {
  let meilleur: [string, Secteur | null] | null = null
  for (const entree of table) {
    if (code.startsWith(entree[0]) && (!meilleur || entree[0].length > meilleur[0].length)) {
      meilleur = entree
    }
  }
  return meilleur ? { secteur: meilleur[1] } : null
}

function secteurDUnCode(brut: string): Secteur | null {
  const code = normaliserNaf(brut)
  if (!code) return null

  // Une correction 2025 l'emporte sur le tableau commun, même plus courte.
  const correction = estNaf2025(code) ? chercher(code, CORRECTIONS_NAF_2025) : null
  return (correction ?? chercher(code, SECTEUR_PAR_NAF))?.secteur ?? null
}

/**
 * Secteur de l'entreprise. On passe tous ses codes connus (NAF 2025 d'abord,
 * puis rév. 2) : le premier qui mène à un secteur l'emporte.
 */
export function secteurPourNaf(...codes: (string | null | undefined)[]): Secteur | null {
  for (const code of codes) {
    const secteur = code ? secteurDUnCode(code) : null
    if (secteur) return secteur
  }
  return null
}
