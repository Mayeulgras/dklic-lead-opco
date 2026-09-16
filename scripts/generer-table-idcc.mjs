/**
 * Génère `lib/financement/idcc-opco.ts` à partir de la table SIRET-OPCO
 * officielle de France Compétences (data.gouv.fr, Licence Ouverte 2.0).
 *
 * Le fichier source fait ~108 Mo et associe chaque établissement à son OPCO,
 * avec l'IDCC applicable. On le lit en flux pour en dériver la correspondance
 * IDCC -> OPCO, qui tient elle en quelques kilo-octets.
 *
 * Un IDCC dont l'OPCO majoritaire ne fait pas au moins 60 % est écarté plutôt
 * que tranché au hasard : mieux vaut « OPCO non identifié » qu'un mauvais
 * forfait horaire.
 *
 * À relancer quand France Compétences publie une nouvelle version :
 *   node scripts/generer-table-idcc.mjs
 */
import { createWriteStream } from "node:fs"
import { createInterface } from "node:readline"
import { Readable } from "node:stream"

const SOURCE =
  "https://static.data.gouv.fr/resources/table-siret-opco/20260811-110956/siro-202608.csv"
const SORTIE = new URL("../lib/financement/idcc-opco.ts", import.meta.url)
const ACCORD_MIN = 0.6

/** Libellés de la table officielle -> identifiants internes. */
const NORMALISATION = {
  AFDAS: "AFDAS",
  AKTO: "AKTO",
  ATLAS: "ATLAS",
  CONSTRUCTYS: "CONSTRUCTYS",
  "L'OPCOMMERCE": "OPCOMMERCE",
  OCAPIAT: "OCAPIAT",
  "OPCO EP": "OPCO_EP",
  "OPCO MOBILITES": "OPCO_MOBILITES",
  "OPCO SANTE": "OPCO_SANTE",
  OPCO2I: "OPCO_2I",
  "UNIFORMATION COHESION SOCIALE": "UNIFORMATION",
}

/** Valeurs d'échappement : « pas de convention » ou « non déterminée ». */
const IDCC_NEUTRES = new Set(["", "0000", "9998", "9999"])

console.log("Téléchargement de la table SIRET-OPCO...")
const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Source injoignable : ${res.status}`)

const compte = new Map() // idcc -> Map(opco -> n)
let lignes = 0

const rl = createInterface({
  input: Readable.fromWeb(res.body),
  crlfDelay: Infinity,
})

for await (const ligne of rl) {
  if (lignes++ === 0) continue // en-tête
  const [, idcc, opco] = ligne.split("|")
  if (!idcc || !opco) continue

  const cle = idcc.trim()
  const nom = opco.trim()
  if (IDCC_NEUTRES.has(cle) || !nom) continue

  if (!compte.has(cle)) compte.set(cle, new Map())
  const c = compte.get(cle)
  c.set(nom, (c.get(nom) ?? 0) + 1)
}

const parOpco = new Map()
let ecartes = 0

for (const [idcc, c] of compte) {
  let total = 0
  let meilleur = null
  let max = 0
  for (const [nom, n] of c) {
    total += n
    if (n > max) [meilleur, max] = [nom, n]
  }

  if (max / total < ACCORD_MIN) {
    ecartes++
    continue
  }

  const id = NORMALISATION[meilleur]
  if (!id) {
    console.warn(`OPCO inconnu ignoré : ${meilleur}`)
    continue
  }

  if (!parOpco.has(id)) parOpco.set(id, [])
  parOpco.get(id).push(idcc)
}

const retenus = [...parOpco.values()].reduce((n, l) => n + l.length, 0)

const corps = [...parOpco.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, idccs]) => {
    const liste = idccs
      .sort()
      .map((i) => `"${i}"`)
      .join(", ")
    return `  ${id}: [\n    ${liste.replace(/(.{88}, )/g, "$1\n    ")},\n  ],`
  })
  .join("\n")

const contenu = `// Fichier généré — ne pas éditer à la main.
// Régénérer : node scripts/generer-table-idcc.mjs
//
// Source : Table SIRET-OPCO de France Compétences (data.gouv.fr),
// Licence Ouverte 2.0. ${lignes.toLocaleString("fr-FR")} établissements agrégés,
// ${retenus} IDCC retenus, ${ecartes} écartés faute d'OPCO majoritaire net.
// Généré le ${new Date().toISOString().slice(0, 10)}.

import type { OpcoId } from "./opcos"

export const IDCC_PAR_OPCO: Record<OpcoId, string[]> = {
${corps}
}
`

await new Promise((resolve, reject) => {
  const out = createWriteStream(SORTIE)
  out.on("error", reject)
  out.on("finish", resolve)
  out.end(contenu)
})

console.log(
  `${lignes.toLocaleString("fr-FR")} lignes lues, ${retenus} IDCC retenus, ${ecartes} écartés.`
)
console.log(`Écrit : ${SORTIE.pathname}`)
