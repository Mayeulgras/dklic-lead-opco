import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { choisirFormations, modeSecteurs, normaliserNom, type Formation } from "./selection"

/** Une formation réduite à ce qui compte pour le choix. */
const f = (id: number, poles: string[], secteurs: string[] = []): Formation => ({
  id,
  nom: `Formation ${id}`,
  accroche: "",
  poles,
  secteurs,
  url: "",
  image: "",
})

const ids = (formations: Formation[]) => formations.map((x) => x.id)
const entreprise = (codeNaf: string, codeNaf2025 = "") => ({ codeNaf, codeNaf2025 })

// Le catalogue réel de la base de test, réduit, dans l'ordre « En vedette ».
const PAR_POLES = [
  f(1, ["Commerce et C.R.T.H."]),
  f(2, ["QVCT"]),
  f(3, ["QVCT"]),
  f(5, ["Numérique"]),
  f(6, ["Médico-social"]),
  f(7, ["Mobilité"]),
  f(8, ["Finance"]),
  f(9, ["Médico-social"]),
  f(10, ["SPA et Bien-être"]),
]

describe("mode « par pôles » (secteurs pas encore renseignés dans Odoo)", () => {
  it("met d'abord le pôle du secteur, puis des pôles transversaux variés", () => {
    assert.deepEqual(ids(choisirFormations(PAR_POLES, entreprise("87.10A"))), [6, 9, 2]) // EHPAD
  })

  it("fonctionne avec le seul code 2027", () => {
    assert.deepEqual(ids(choisirFormations(PAR_POLES, entreprise("", "87.10G"))), [6, 9, 2])
  })

  it("corrige les associations douteuses : crèche, dentiste, coiffeur, garage", () => {
    for (const naf of ["88.91A", "86.23Z", "96.02A", "45.20A"]) {
      assert.deepEqual(ids(choisirFormations(PAR_POLES, entreprise(naf))), [2, 5, 8], naf)
    }
  })

  it("varie les pôles pour une entreprise sans secteur", () => {
    assert.deepEqual(ids(choisirFormations(PAR_POLES, entreprise("70.10Z"))), [2, 5, 8])
  })

  it("garde l'ordre « En vedette » quand les pôles manquent", () => {
    const qvct = [f(2, ["QVCT"]), f(3, ["QVCT"]), f(4, ["QVCT"])]
    assert.deepEqual(ids(choisirFormations(qvct, entreprise("70.10Z"))), [2, 3, 4])
  })
})

describe("mode « par secteurs » (dklic a renseigné Odoo)", () => {
  const PAR_SECTEURS = [
    f(1, ["Mobilité"], ["Transport et logistique"]),
    f(2, ["Mobilité"], ["Industrie", "BTP", "Transport et logistique", "Commerce"]), // chariot R489
    f(3, ["Commerce et C.R.T.H."], ["Tous secteurs"]), // obligations de l'employeur
    f(4, ["QVCT"], ["Tous secteurs"]),
    f(5, ["QVCT"], ["Tous secteurs"]),
    f(6, ["Numérique"], ["Tous secteurs"]),
    f(7, ["SPA et Bien-être"], ["Beauté et bien-être"]),
    f(8, ["Médico-social"], ["Santé et médico-social"]),
    f(9, ["Médico-social"], []), // oubliée par dklic : jamais proposée
  ]

  it("est actif dès qu'une formation a un secteur", () => {
    assert.equal(modeSecteurs(PAR_SECTEURS), true)
    assert.equal(modeSecteurs(PAR_POLES), false)
  })

  it("propose les formations ciblées puis celles pour tous", () => {
    assert.deepEqual(ids(choisirFormations(PAR_SECTEURS, entreprise("25.62B"))), [2, 3, 4]) // usinage
    assert.deepEqual(ids(choisirFormations(PAR_SECTEURS, entreprise("96.02A"))), [7, 3, 4]) // coiffeur
  })

  it("n'affiche que « Tous secteurs » à une entreprise sans secteur, en variant les pôles", () => {
    assert.deepEqual(ids(choisirFormations(PAR_SECTEURS, entreprise("96.09Z", "96.99H"))), [3, 4, 6])
  })

  it("ne propose jamais une formation sans secteur", () => {
    assert.ok(!ids(choisirFormations(PAR_SECTEURS, entreprise("87.10A"))).includes(9))
  })

  it("ignore accents et majuscules dans les noms de secteurs", () => {
    const formations = [f(1, [], ["SANTE ET MEDICO-SOCIAL"])]
    assert.deepEqual(ids(choisirFormations(formations, entreprise("87.10A"))), [1])
    assert.equal(normaliserNom(" Santé et médico-social "), "sante et medico-social")
  })
})

it("se contente de ce qui existe", () => {
  assert.deepEqual(ids(choisirFormations([f(5, ["Numérique"])], entreprise("70.10Z"))), [5])
  assert.deepEqual(choisirFormations([], entreprise("87.10A")), [])
})
