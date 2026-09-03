import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    // Next infère la racine en remontant jusqu'au premier lockfile trouvé. Un
    // `package-lock.json` traîne dans le répertoire utilisateur, ce qui lui
    // faisait choisir celui-ci plutôt que le projet. On la fixe explicitement.
    root: path.resolve(import.meta.dirname),
  },
}

export default nextConfig
