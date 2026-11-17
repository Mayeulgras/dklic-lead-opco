import assert from "node:assert/strict"
import { describe, it } from "vitest"

import type { AppelOdoo } from "./client"
import { lireCatalogueOdoo } from "./formations"

const CATEGORIES = [
  { id: 1, name: "Pôles", parent_id: false },
  { id: 2, name: "Formateurs", parent_id: false },
  { id: 21, name: "Thèmes", parent_id: false },
  { id: 5, name: "Numérique", parent_id: [1, "Pôles"] },
  { id: 6, name: "QVCT", parent_id: [1, "Pôles"] },
  { id: 13, name: "Emma MSELLATI", parent_id: [2, "Formateurs"] },
  { id: 25, name: "IA", parent_id: [21, "Thèmes"] },
  { id: 60, name: "Secteurs", parent_id: false },
  { id: 61, name: "Tous secteurs", parent_id: [60, "Secteurs"] },
  { id: 62, name: "Numérique", parent_id: [60, "Secteurs"] },
]

const PRODUITS = [
  {
    id: 22,
    name: "Maîtriser les fondamentaux de l'IA Générative",
    description_sale: "\nComprendre et utiliser les outils d'IA.\nPasser à une utilisation autonome.",
    public_categ_ids: [5, 13, 25, 61, 62],
    website_url: "/shop/maitriser-les-fondamentaux-de-l-ia-generative-22",
  },
  { id: 16, name: "Énergie et Vitalité", description_sale: false, public_categ_ids: [6], website_url: false },
]

function fauxOdoo(produits: unknown = PRODUITS) {
  const appels: { modele: string; parametres: Record<string, unknown> }[] = []
  const odoo = (async (modele: string, _methode: string, parametres: Record<string, unknown> = {}) => {
    appels.push({ modele, parametres })
    return modele === "product.template" ? produits : CATEGORIES
  }) as AppelOdoo
  return { odoo, appels }
}

describe("lireCatalogueOdoo", () => {
  it("transforme les produits publiés en formations", async () => {
    const { odoo } = fauxOdoo()
    const { formations, lienBoutique } = await lireCatalogueOdoo(odoo, "https://dklic.odoo.com")

    assert.equal(lienBoutique, "https://dklic.odoo.com/shop")
    assert.deepEqual(formations[0], {
      id: 22,
      nom: "Maîtriser les fondamentaux de l'IA Générative",
      accroche: "Comprendre et utiliser les outils d'IA.",
      poles: ["Numérique"],
      secteurs: ["Tous secteurs", "Numérique"],
      url: "https://dklic.odoo.com/shop/maitriser-les-fondamentaux-de-l-ia-generative-22",
      image: "https://dklic.odoo.com/web/image/product.template/22/image_512",
    })
  })

  it("range pôles et secteurs à part, sans les thèmes ni les formateurs", async () => {
    const { formations } = await lireCatalogueOdoo(fauxOdoo().odoo, "https://x")
    // « Numérique » existe comme pôle et comme secteur : chacun dans sa famille.
    assert.deepEqual(formations[0].poles, ["Numérique"])
    assert.deepEqual(formations[0].secteurs, ["Tous secteurs", "Numérique"])
    assert.deepEqual(formations[1].secteurs, [])
  })

  it("supporte une formation sans description ni page", async () => {
    const { formations } = await lireCatalogueOdoo(fauxOdoo().odoo, "https://x")
    assert.equal(formations[1].accroche, "")
    assert.equal(formations[1].url, "https://x/shop")
  })

  it("demande les produits publiés dans l'ordre « En vedette »", async () => {
    const { odoo, appels } = fauxOdoo()
    await lireCatalogueOdoo(odoo, "https://x")
    const produits = appels.find((a) => a.modele === "product.template")!.parametres
    assert.deepEqual(produits.domain, [["is_published", "=", true]])
    assert.equal(produits.order, "website_sequence asc, id asc")
  })

  it("échoue clairement si Odoo change de format", async () => {
    await assert.rejects(lireCatalogueOdoo(fauxOdoo([{ id: "x" }]).odoo, "https://x"))
  })
})
