import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { formaterNom } from "./format"

describe("formaterNom", () => {
  it("remet les noms de l'annuaire en casse de titre", () => {
    assert.equal(formaterNom("CABINET ETCHE AVOCATS"), "Cabinet Etche Avocats")
    assert.equal(formaterNom("BIARRITZ"), "Biarritz")
    assert.equal(formaterNom("RUEIL-MALMAISON"), "Rueil-Malmaison")
  })

  it("garde les sigles et les formes juridiques en majuscules", () => {
    assert.equal(
      formaterNom("DANONE PRODUITS FRAIS FRANCE (D.P.F.F.)"),
      "Danone Produits Frais France (D.P.F.F.)"
    )
    assert.equal(formaterNom("SARL RESTAURANT LES PEUPLIERS"), "SARL Restaurant les Peupliers")
  })

  it("gère les apostrophes et les mots de liaison", () => {
    assert.equal(formaterNom("L'ENCLUME (RESTAURANT)"), "L'Enclume (Restaurant)")
    assert.equal(formaterNom("BOULANGERIE D'ARTOIS"), "Boulangerie d'Artois")
  })

  it("laisse les numéros intacts dans les adresses", () => {
    assert.equal(formaterNom("59-61 RUE LA FAYETTE 75009 PARIS"), "59-61 Rue la Fayette 75009 Paris")
  })

  it("respecte une saisie déjà en casse mixte", () => {
    assert.equal(formaterNom("Olivia Danon"), "Olivia Danon")
  })
})
