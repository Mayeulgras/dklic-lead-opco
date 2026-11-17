import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { estNaf2025, SECTEUR_PAR_NAF, CORRECTIONS_NAF_2025, SECTEURS, secteurPourNaf } from "./secteurs"

/**
 * Métiers types, avec leur code actuel et leur code 2027 tels que les donne la
 * table de correspondance de l'Insee : le secteur doit être le même avant et
 * après la bascule.
 */
const METIERS: [metier: string, rev2: string, naf2025: string, secteur: string | null][] = [
  ["EHPAD", "87.10A", "87.10G", "Santé et médico-social"],
  ["Aide à domicile", "88.10A", "88.10G", "Santé et médico-social"],
  ["Hôpital", "86.10Z", "86.10Y", "Santé et médico-social"],
  ["Crèche", "88.91A", "88.91G", "Petite enfance"],
  ["Crèche (pré-primaire en 2027)", "88.91A", "85.10Y", "Petite enfance"],
  ["Dentiste", "86.23Z", "86.23Y", "Professions de santé"],
  ["Infirmier", "86.90D", "86.94G", "Professions de santé"],
  ["Coiffeur", "96.02A", "96.21G", "Beauté et bien-être"],
  ["Spa", "96.04Z", "96.23Y", "Beauté et bien-être"],
  ["Garage", "45.20A", "95.31G", "Automobile"],
  ["Loueur de voitures", "77.11A", "77.11Y", "Automobile"],
  ["Boulangerie", "10.71C", "10.71H", "Artisanat alimentaire"],
  ["Hypermarché", "47.11F", "47.11K", "Commerce"],
  ["Restaurant", "56.10A", "56.11G", "Hôtellerie et restauration"],
  ["Électricien", "43.21A", "43.21G", "BTP"],
  ["Éditeur de logiciels", "62.01Z", "62.10Y", "Numérique"],
  ["Avocat", "69.10Z", "69.10Y", "Juridique et comptable"],
  ["Salle de fitness", "93.13Z", "93.13Y", "Sport et loisirs"],
  ["Siège social", "70.10Z", "70.10Y", null],
  ["Holding", "64.20Z", "64.21Y", null],
  ["Autres services personnels", "96.09Z", "96.99H", null],
]

describe("secteurPourNaf", () => {
  for (const [metier, rev2, naf2025, secteur] of METIERS) {
    it(`${metier} : même secteur avant et après 2027`, () => {
      assert.equal(secteurPourNaf(rev2), secteur, `code actuel ${rev2}`)
      assert.equal(secteurPourNaf(naf2025), secteur, `code 2027 ${naf2025}`)
    })
  }

  it("n'applique les corrections 2027 qu'aux codes 2027", () => {
    // 47.81 : marchés alimentaires aujourd'hui, concessions automobiles en 2027.
    assert.equal(secteurPourNaf("47.81Z"), "Commerce")
    assert.equal(secteurPourNaf("47.81Y"), "Automobile")
  })

  it("préfère le code 2027 et se rabat sur l'ancien", () => {
    assert.equal(secteurPourNaf("85.10Y", "88.91A"), "Petite enfance")
    assert.equal(secteurPourNaf("", "88.91A"), "Petite enfance")
    assert.equal(secteurPourNaf(undefined, null, "86.23Z"), "Professions de santé")
  })

  it("accepte le code sans point et ignore les codes vides", () => {
    assert.equal(secteurPourNaf("8710A"), "Santé et médico-social")
    assert.equal(secteurPourNaf(""), null)
  })
})

describe("estNaf2025", () => {
  it("reconnaît la nomenclature à la dernière lettre", () => {
    for (const code of ["87.10G", "88.91H", "10.71J", "47.11K", "86.10Y"]) assert.ok(estNaf2025(code), code)
    for (const code of ["87.10A", "47.11F", "86.10Z"]) assert.ok(!estNaf2025(code), code)
  })
})

it("n'utilise que des secteurs de la liste", () => {
  const connus = new Set<string | null>([...SECTEURS, null])
  for (const [prefixe, secteur] of [...SECTEUR_PAR_NAF, ...CORRECTIONS_NAF_2025]) {
    assert.ok(connus.has(secteur), `${prefixe} → ${secteur}`)
  }
})
