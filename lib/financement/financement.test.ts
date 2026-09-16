import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { PLAFONDS_ANNUELS, budgetAnnuel } from "./budget"
import { tailleDepuisTranche } from "./effectif"
import { NB_IDCC_COUVERTS, resoudreOpco } from "./opco-resolution"
import { OPCOS, type OpcoId } from "./opcos"

const TOUS_LES_OPCO = Object.keys(OPCOS) as OpcoId[]

describe("taille de l'entreprise", () => {
  it("range les tranches INSEE dans les trois tailles", () => {
    assert.equal(tailleDepuisTranche("00"), "moins11") // 0 salarié
    assert.equal(tailleDepuisTranche("03"), "moins11") // 6 à 9
    assert.equal(tailleDepuisTranche("11"), "de11a49") // 10 à 19
    assert.equal(tailleDepuisTranche("12"), "de11a49") // 20 à 49
    assert.equal(tailleDepuisTranche("21"), "plus50") // 50 à 99
    assert.equal(tailleDepuisTranche("53"), "plus50") // 10 000 et plus
  })

  it("laisse le visiteur choisir quand l'effectif est inconnu", () => {
    for (const code of ["NN", null, "", "99"]) {
      assert.equal(tailleDepuisTranche(code), null, `code ${code}`)
    }
  })
})

describe("budget annuel", () => {
  it("lit le plafond de l'OPCO pour la taille", () => {
    assert.equal(budgetAnnuel("AFDAS", "moins11"), 1_100)
    assert.equal(budgetAnnuel("AFDAS", "de11a49"), 1_800)
    assert.equal(budgetAnnuel("OPCO_EP", "moins11"), 4_200)
  })

  it("n'annonce aucune enveloppe au-delà de 50 salariés", () => {
    for (const opco of [...TOUS_LES_OPCO, null]) {
      assert.equal(budgetAnnuel(opco, "plus50"), null, `${opco}`)
    }
  })

  it("donne une estimation moyenne quand l'OPCO est inconnu", () => {
    const moins11 = budgetAnnuel(null, "moins11")!
    const de11a49 = budgetAnnuel(null, "de11a49")!

    // Médiane des onze OPCO : ni le plus bas, ni le plus haut.
    const valeurs = Object.values(PLAFONDS_ANNUELS).map((p) => p.moins11)
    assert.ok(moins11 > Math.min(...valeurs) && moins11 < Math.max(...valeurs))
    assert.ok(de11a49 >= moins11)
  })

  it("couvre les onze OPCO avec des montants plausibles", () => {
    for (const opco of TOUS_LES_OPCO) {
      const { moins11, de11a49 } = PLAFONDS_ANNUELS[opco]

      // Fourchette réellement observée sur les grilles 2026.
      assert.ok(moins11 >= 1_000 && moins11 <= 10_000, `${opco} moins11 = ${moins11}`)
      assert.ok(de11a49 >= 1_000 && de11a49 <= 10_000, `${opco} de11a49 = ${de11a49}`)
      // Une entreprise plus grande n'obtient jamais moins.
      assert.ok(de11a49 >= moins11, `${opco} : 11-49 < moins de 11`)
    }
  })
})

describe("identification de l'OPCO par IDCC", () => {
  it("couvre l'essentiel des conventions collectives", () => {
    // Table dérivée de 3,6 M d'établissements : un effondrement du nombre
    // signalerait une régénération ratée.
    assert.ok(NB_IDCC_COUVERTS > 900, `seulement ${NB_IDCC_COUVERTS} IDCC`)
  })

  it("résout des conventions connues", () => {
    assert.equal(resoudreOpco(["1486"]), "ATLAS") // bureaux d'études (Syntec)
    assert.equal(resoudreOpco(["2596"]), "OPCO_EP") // coiffure
    assert.equal(resoudreOpco(["2511"]), "AFDAS") // sport
  })

  it("tolère les IDCC non normalisés", () => {
    assert.equal(resoudreOpco(["01486"]), "ATLAS")
    assert.equal(resoudreOpco([" 1486 "]), "ATLAS")
  })

  it("ignore les valeurs d'échappement", () => {
    for (const neutre of ["9999", "9998", "0000"]) {
      assert.equal(resoudreOpco([neutre]), null, `idcc ${neutre}`)
    }
    assert.equal(resoudreOpco(["9999", "1486"]), "ATLAS")
  })

  it("renvoie null plutôt que de deviner", () => {
    for (const vide of [null, undefined, [], ["0001999"], ["abc"]]) {
      assert.equal(resoudreOpco(vide), null, `entrée ${JSON.stringify(vide)}`)
    }
  })
})
