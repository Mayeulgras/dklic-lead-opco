import path from "node:path"
import type { NextConfig } from "next"

/**
 * Les images des formations viennent de l'Odoo de dklic. On n'autorise que
 * cette adresse-là (et seulement ses images produits), pour que l'optimiseur
 * d'images du site ne serve pas de relais vers n'importe quel autre site.
 */
const hoteOdoo = process.env.ODOO_URL ? new URL(process.env.ODOO_URL).hostname : null

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hoteOdoo
      ? [{ protocol: "https", hostname: hoteOdoo, port: "", pathname: "/web/image/**", search: "" }]
      : [],
  },
  turbopack: {
    // Next infère la racine en remontant jusqu'au premier lockfile trouvé. Un
    // `package-lock.json` traîne dans le répertoire utilisateur, ce qui lui
    // faisait choisir celui-ci plutôt que le projet. On la fixe explicitement.
    root: path.resolve(import.meta.dirname),
  },
}

export default nextConfig
