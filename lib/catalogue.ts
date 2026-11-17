import "server-only"

import { unstable_cache } from "next/cache"

import type { Catalogue } from "./formations/selection"
import { clientOdoo, configOdoo } from "./odoo/client"
import { lireCatalogueOdoo } from "./odoo/formations"

/**
 * Le catalogue des formations, gardé une heure : on n'interroge pas Odoo à
 * chaque visiteur. Une erreur n'est pas mise en cache (la lecture suivante
 * réessaie) et ne remonte jamais : sans catalogue, la page s'affiche sans les
 * cartes, le budget reste visible.
 *
 * `unstable_cache` plutôt que `use cache` : ce dernier exige d'activer les
 * Cache Components, ce que le projet ne fait pas.
 */
const catalogueEnCache = unstable_cache(
  async (url: string) => {
    const config = configOdoo()
    if (!config) throw new Error("Odoo n'est pas configuré")
    return lireCatalogueOdoo(clientOdoo(config), url)
  },
  ["catalogue-formations"],
  { revalidate: 3600, tags: ["catalogue-formations"] }
)

export async function chargerCatalogue(): Promise<Catalogue | null> {
  const config = configOdoo()
  if (!config) return null

  try {
    // L'adresse fait partie de la clé : base de test et vraie base ne se mélangent pas.
    return await catalogueEnCache(config.url)
  } catch (erreur) {
    console.error("Catalogue des formations indisponible :", erreur)
    return null
  }
}
