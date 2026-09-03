import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { analyserEntreprise, estimer, fourchette } from "./calcul"
import { BAREME_DEFAUT } from "./baremes"

describe("grille du client", () => {
  // La grille du mail : 30 €/h × 7 h × jours × apprenants, avant écrêtage.
  const cas = [
    { jours: 1, apprenants: 5, attendu: 1_050 },
    { jours: 1, apprenants: 12, attendu: 2_520 },
    { jours: 2, apprenants: 5, attendu: 2_100 },
    { jours: 2, apprenants: 12, attendu: 5_040 },
    { jours: 3, apprenants: 5, attendu: 3_150 },
    { jours: 3, apprenants: 12, attendu: 7_560 },
  ]

  for (const { jours, apprenants, attendu } of cas) {
    it(`${jours} jour(s), ${apprenants} apprenants => ${attendu} € brut`, () => {
      assert.equal(estimer({ jours, apprenants }, null).montantBrut, attendu)
    })
  }
})

describe("écrêtage sur les plafonds", () => {
  it("applique le plafond journalier quand le groupe est trop grand", () => {
    // 30 × 7 × 12 = 2 520 €/jour, au-dessus du plafond de 2 000 € constaté.
    const e = estimer({ jours: 1, apprenants: 12 }, null)

    assert.equal(e.montantBrut, 2_520)
    assert.equal(e.montant, 2_000)
    assert.equal(e.plafondApplique, "journalier")
  })

  it("applique le plafond annuel sur les durées longues", () => {
    // Le maximum de la grille client (7 560 €) dépasse le plafond annuel.
    const e = estimer({ jours: 3, apprenants: 12 }, null)

    assert.equal(e.montantBrut, 7_560)
    assert.equal(e.montant, BAREME_DEFAUT.plafondAnnuel)
    assert.equal(e.plafondApplique, "annuel")
  })

  it("n'écrête pas un montant qui reste sous les plafonds", () => {
    const e = estimer({ jours: 1, apprenants: 5 }, null)

    assert.equal(e.montant, 1_050)
    assert.equal(e.plafondApplique, null)
  })

  it("ne renvoie jamais un montant supérieur au brut", () => {
    for (let jours = 1; jours <= 3; jours++) {
      for (let apprenants = 1; apprenants <= 12; apprenants++) {
        const e = estimer({ jours, apprenants }, null)
        assert.ok(e.montant <= e.montantBrut, `${jours}j / ${apprenants} appr.`)
      }
    }
  })
})

describe("barème par OPCO", () => {
  it("utilise le forfait de l'OPCO identifié", () => {
    // Uniformation : 18 €/h contre 30 €/h par défaut.
    assert.equal(estimer({ jours: 1, apprenants: 5 }, "Uniformation").montantBrut, 630)
  })

  it("retombe sur le barème par défaut pour un OPCO inconnu", () => {
    const e = estimer({ jours: 1, apprenants: 5 }, "OPCO Inexistant")

    assert.equal(e.bareme.forfaitHoraire, BAREME_DEFAUT.forfaitHoraire)
  })

  it("ne propose pas de bonus quand les frais annexes sont exclus", () => {
    assert.equal(estimer({ jours: 1, apprenants: 5 }, "OPCOMMERCE").bonusAccompagnement, null)
  })
})

describe("effet de l'effectif", () => {
  it("plafonne le groupe sur les petites structures", () => {
    const c = analyserEntreprise("03") // 6 à 9 salariés

    assert.equal(c.apprenantsMax, 9)
    assert.equal(c.eligibleFondsMutualises, true)
  })

  it("abaisse le plancher quand l'entreprise ne peut pas réunir 5 personnes", () => {
    const c = analyserEntreprise("01") // 1 ou 2 salariés

    assert.equal(c.apprenantsMax, 2)
    assert.equal(c.apprenantsMin, 2)
  })

  it("marque la perte d'accès aux fonds mutualisés à 50 salariés", () => {
    assert.equal(analyserEntreprise("12").eligibleFondsMutualises, true) // 20-49
    assert.equal(analyserEntreprise("21").eligibleFondsMutualises, false) // 50-99
  })

  it("signale un effectif inconnu au lieu de le deviner", () => {
    for (const code of ["NN", null, ""]) {
      assert.equal(analyserEntreprise(code).effectifInconnu, true, `code ${code}`)
    }
  })

  it("ne multiplie jamais le montant par l'effectif", () => {
    // Le point de vigilance central : un groupe de 10 000 salariés doit obtenir
    // le même montant qu'une PME, jamais un total multiplié.
    const pme = fourchette(analyserEntreprise("12"), 3, null)
    const groupe = fourchette(analyserEntreprise("53"), 3, null)

    assert.deepEqual(pme, groupe)
    assert.ok(groupe.max <= 10_000)
  })
})
