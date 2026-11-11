import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const racine = (chemin: string) => fileURLToPath(new URL(chemin, import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${racine("./")}` },
      // Next.js gère lui-même `server-only` ; hors de Next (tests), il ne fait rien.
      { find: "server-only", replacement: racine("./test/server-only.ts") },
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: { name: "unit", include: ["**/*.test.ts"], exclude: ["node_modules/**", ".next/**"] },
      },
      {
        // Contacte le vrai Odoo et le vrai serveur mail : jamais lancé par `npm test`.
        extends: true,
        test: { name: "verif", include: ["scripts/**/*.verif.ts"], testTimeout: 60_000 },
      },
    ],
  },
})
