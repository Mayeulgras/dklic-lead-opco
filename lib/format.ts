/**
 * L'annuaire des entreprises renvoie noms et adresses en majuscules
 * (« CABINET ETCHE AVOCATS »). On les remet en casse de titre pour l'affichage
 * uniquement : la donnée transmise au CRM reste celle de l'annuaire.
 */

/** Mots de liaison laissés en minuscules, sauf en tête. */
const PETITS_MOTS = new Set([
  "à", "au", "aux", "d", "de", "des", "du", "en", "et", "l", "la", "le", "les",
  "par", "pour", "sur",
])

/** Formes juridiques et sigles courants, qui restent en majuscules. */
const SIGLES = new Set([
  "EI", "EIRL", "EURL", "GIE", "SA", "SARL", "SAS", "SASU", "SCI", "SCM", "SCOP",
  "SCP", "SELARL", "SELAS", "SEM", "SNC",
])

export function formaterNom(brut: string): string {
  // Une saisie déjà en casse mixte a été écrite par quelqu'un : on la respecte.
  if (brut !== brut.toLocaleUpperCase("fr")) return brut

  let premierMot = true

  return brut
    .split(/(\s+|-|'|’|\(|\)|\/|,)/)
    .map((morceau) => {
      if (!/\p{L}/u.test(morceau)) return morceau

      const estPremier = premierMot
      premierMot = false

      // Sigles pointés (« D.P.F.F. »), mots avec chiffres, formes juridiques.
      if (morceau.includes(".") || /\d/.test(morceau) || SIGLES.has(morceau)) {
        return morceau
      }

      const minuscule = morceau.toLocaleLowerCase("fr")
      if (!estPremier && PETITS_MOTS.has(minuscule)) return minuscule

      return minuscule.charAt(0).toLocaleUpperCase("fr") + minuscule.slice(1)
    })
    .join("")
}
