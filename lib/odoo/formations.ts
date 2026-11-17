import "server-only"

import { z } from "zod"

import type { Catalogue, Formation } from "../formations/selection"
import type { AppelOdoo } from "./client"

/**
 * Lit le catalogue dans Odoo : les produits publiés sur la boutique (ce sont
 * les formations dklic) et leurs catégories publiques, rangées par familles :
 * « Pôles », « Thèmes », « Formateurs » et, une fois créée par dklic,
 * « Secteurs ». Pôles et secteurs servent au choix des cartes.
 */

const NOM_FAMILLE_POLES = "Pôles"
const NOM_FAMILLE_SECTEURS = "Secteurs"

// Validés à la frontière : un changement côté Odoo doit produire une erreur
// claire, pas une carte vide.
const produitsSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    description_sale: z.union([z.string(), z.literal(false)]).nullish(),
    public_categ_ids: z.array(z.number()),
    website_url: z.union([z.string(), z.literal(false)]).nullish(),
  })
)

const categoriesSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    // Odoo renvoie `false` pour un champ relationnel vide, sinon [id, nom].
    parent_id: z.union([z.tuple([z.number(), z.string()]), z.literal(false)]),
  })
)

/** Première ligne non vide : la description de vente commence par l'accroche. */
function premiereLigne(texte: string): string {
  return (
    texte
      .split("\n")
      .map((ligne) => ligne.trim())
      .find(Boolean) ?? ""
  )
}

export async function lireCatalogueOdoo(odoo: AppelOdoo, urlSite: string): Promise<Catalogue> {
  const [produitsBruts, categoriesBrutes] = await Promise.all([
    odoo("product.template", "search_read", {
      domain: [["is_published", "=", true]],
      fields: ["name", "description_sale", "public_categ_ids", "website_url"],
      // Le classement « En vedette » de la boutique.
      order: "website_sequence asc, id asc",
    }),
    odoo("product.public.category", "search_read", {
      domain: [],
      fields: ["name", "parent_id"],
    }),
  ])

  const produits = produitsSchema.parse(produitsBruts)
  const categories = categoriesSchema.parse(categoriesBrutes)

  const famille = (nom: string) =>
    new Map(
      categories.filter((c) => c.parent_id && c.parent_id[1] === nom).map((c) => [c.id, c.name])
    )
  const poles = famille(NOM_FAMILLE_POLES)
  const secteurs = famille(NOM_FAMILLE_SECTEURS)

  const formations: Formation[] = produits.map((p) => ({
    id: p.id,
    nom: p.name,
    accroche: premiereLigne(p.description_sale || ""),
    poles: p.public_categ_ids.flatMap((id) => poles.get(id) ?? []),
    secteurs: p.public_categ_ids.flatMap((id) => secteurs.get(id) ?? []),
    url: `${urlSite}${p.website_url || "/shop"}`,
    image: `${urlSite}/web/image/product.template/${p.id}/image_512`,
  }))

  return { formations, lienBoutique: `${urlSite}/shop` }
}
