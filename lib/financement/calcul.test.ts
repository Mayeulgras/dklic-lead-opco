import assert from "node:assert/strict"
import { describe, it } from "vitest"

import {
  analyserEntreprise,
  contexteDepuisEffectif,
  estimer,
  fourchette,
} from "./calcul"
import { BAREME_DEFAUT, baremeReleve } from "./baremes"
import { NB_IDCC_COUVERTS, resoudreOpco } from "./opco-resolution"
import { OPCOS } from "./opcos"

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
    assert.equal(estimer({ jours: 1, apprenants: 5 }, "UNIFORMATION").montantBrut, 630)
  })

  it("distingue une grille relevée d'un forfait estimé", () => {
    // Constructys : 19 €/h relevés sur la grille Bâtiment 2026.
    assert.equal(estimer({ jours: 1, apprenants: 5 }, "CONSTRUCTYS").montantBrut, 665)
    assert.equal(baremeReleve("CONSTRUCTYS"), true)

    // OPCO Santé ne publie pas de grille accessible : forfait estimé, ce que
    // l'interface doit dire au lieu de l'afficher comme un tarif officiel.
    assert.equal(baremeReleve("OPCO_SANTE"), false)
    assert.equal(baremeReleve("OPCOMMERCE"), false)
  })

  it("n'estime que les deux OPCO dont la grille est introuvable", () => {
    const estimes = (Object.keys(OPCOS) as (keyof typeof OPCOS)[]).filter(
      (o) => !baremeReleve(o)
    )

    assert.deepEqual(estimes.sort(), ["OPCOMMERCE", "OPCO_SANTE"])
  })

  it("garde tous les forfaits dans la fourchette réellement observée", () => {
    // Relevé sur les grilles publiées : 9,15 €/h (Mobilités) à 40 €/h.
    // Un chiffre hors de cette plage signalerait une saisie fautive.
    for (const o of Object.keys(OPCOS) as (keyof typeof OPCOS)[]) {
      const f = estimer({ jours: 1, apprenants: 1 }, o).bareme.forfaitHoraire
      assert.ok(f >= 9 && f <= 40, `${o} = ${f} €/h`)
    }
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

  it("accepte un effectif saisi à la main", () => {
    assert.equal(contexteDepuisEffectif(8).apprenantsMax, 8)
    assert.equal(contexteDepuisEffectif(200).apprenantsMax, 12)
    assert.equal(contexteDepuisEffectif(3).apprenantsMin, 3)
  })

  it("place le seuil des fonds mutualisés à 50 sur un effectif saisi", () => {
    assert.equal(contexteDepuisEffectif(49).eligibleFondsMutualises, true)
    assert.equal(contexteDepuisEffectif(50).eligibleFondsMutualises, false)
  })

  it("ne casse pas sur un effectif nul ou négatif", () => {
    for (const n of [0, -5]) {
      const c = contexteDepuisEffectif(n)
      assert.ok(c.apprenantsMax >= 1, `effectif ${n}`)
      assert.ok(c.apprenantsMin >= 1, `effectif ${n}`)
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

describe("résolution de l'OPCO par IDCC", () => {
  it("couvre l'essentiel des conventions collectives", () => {
    // Table dérivée de 3,6 M d'établissements : un effondrement du nombre
    // signalerait une régénération ratée.
    assert.ok(NB_IDCC_COUVERTS > 900, `seulement ${NB_IDCC_COUVERTS} IDCC`)
  })

  it("résout des conventions connues", () => {
    // 1486 = bureaux d'études techniques (Syntec) -> Atlas
    assert.equal(resoudreOpco(["1486"]), "ATLAS")
    // 2596 = coiffure -> OPCO EP
    assert.equal(resoudreOpco(["2596"]), "OPCO_EP")
    // 2511 = sport -> Afdas
    assert.equal(resoudreOpco(["2511"]), "AFDAS")
  })

  it("tolère les IDCC non normalisés", () => {
    assert.equal(resoudreOpco(["01486"]), "ATLAS")
    assert.equal(resoudreOpco([" 1486 "]), "ATLAS")
  })

  it("ignore les valeurs d'échappement", () => {
    // 9999 « hors convention », 9998 « non déterminée » : ne désignent aucune
    // branche et ne doivent jamais choisir un OPCO.
    for (const neutre of ["9999", "9998", "0000"]) {
      assert.equal(resoudreOpco([neutre]), null, `idcc ${neutre}`)
    }
  })

  it("retient la première convention exploitable", () => {
    assert.equal(resoudreOpco(["9999", "1486"]), "ATLAS")
  })

  it("renvoie null plutôt que de deviner", () => {
    for (const vide of [null, undefined, [], ["0001999"], ["abc"]]) {
      assert.equal(resoudreOpco(vide), null, `entrée ${JSON.stringify(vide)}`)
    }
  })

  it("ne référence que des OPCO déclarés", () => {
    for (const idcc of ["1486", "2596", "2511", "1090", "3239"]) {
      const opco = resoudreOpco([idcc])
      if (opco) assert.ok(opco in OPCOS, `${opco} absent de OPCOS`)
    }
  })
})

describe("barèmes relevés", () => {
  // Scénario de référence du client : 3 jours, 10 personnes.
  const ref = { jours: 3, apprenants: 10 }

  it("fait varier fortement le montant selon l'OPCO", () => {
    const parOpco = Object.fromEntries(
      (["OPCO_EP", "AKTO", "OPCO_MOBILITES", "ATLAS", "UNIFORMATION"] as const).map(
        (o) => [o, estimer(ref, o).montant]
      )
    )

    const montants = Object.values(parOpco)
    const min = Math.min(...montants)
    const max = Math.max(...montants)

    // Le point central : pour une formation identique, l'écart entre OPCO est
    // considérable. C'est ce qui justifie de relever les grilles plutôt que
    // d'appliquer 30 €/h partout — et de ne jamais deviner l'OPCO.
    assert.ok(max / min > 3, `écart insuffisant : ${JSON.stringify(parOpco)}`)

    // Mobilités plafonne très bas (1 500 €/an), Atlas paie au-dessus de
    // l'hypothèse à 30 €/h du client : l'estimation moyenne se trompe dans
    // les deux sens, pas seulement à la hausse.
    assert.equal(min, parOpco.OPCO_MOBILITES, JSON.stringify(parOpco))
    assert.ok(parOpco.ATLAS > 7_560, `Atlas = ${parOpco.ATLAS}`)
  })

  it("applique le plafond annuel bas d'OPCO Mobilités", () => {
    const e = estimer(ref, "OPCO_MOBILITES")

    assert.equal(e.montant, 1_500)
    assert.equal(e.plafondApplique, "annuel")
  })

  it("applique le plafond journalier intra d'AKTO", () => {
    // 40 €/h × 7 h × 12 = 3 360 €/jour, au-dessus des 2 800 € de l'intra 5-12.
    const e = estimer({ jours: 1, apprenants: 12 }, "AKTO")

    assert.equal(e.montantBrut, 3_360)
    assert.equal(e.montant, 2_800)
    assert.equal(e.plafondApplique, "journalier")
  })

  it("couvre désormais les OPCO majoritaires du trafic mesuré", () => {
    // OPCO EP, AKTO, Mobilités et Atlas = 71 % des entreprises résolues.
    for (const o of ["OPCO_EP", "AKTO", "OPCO_MOBILITES", "ATLAS"] as const) {
      assert.equal(baremeReleve(o), true, `${o} sans barème`)
    }
  })
})
