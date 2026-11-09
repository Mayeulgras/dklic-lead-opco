/**
 * Vérification de bout en bout du parcours, dans un vrai navigateur.
 *
 * Complète les tests unitaires de `lib/financement/` : ceux-ci prouvent que les
 * montants sont justes, celui-ci que l'interface les affiche correctement.
 *
 * Prérequis : `npm run dev` dans un autre terminal, et Chrome ou Edge installé.
 * Usage : npm run smoke [url]
 */
import { existsSync } from "node:fs"
import { chromium } from "playwright-core"

const URL = process.argv[2] ?? "http://localhost:3000/"

const NAVIGATEURS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]

const executablePath = NAVIGATEURS.find((p) => existsSync(p))
if (!executablePath) {
  console.error("Aucun navigateur trouvé. Renseignez un chemin dans NAVIGATEURS.")
  process.exit(1)
}

/** Chaque cas couvre une branche du résultat. */
const CAS = [
  {
    nom: "OPCO identifié",
    recherche: "CABINET ETCHE AVOCATS", // IDCC 3253 -> OPCO EP
    taille: "0 à 10",
    attendu: { opco: "OPCO EP", montant: "4 200 €" },
  },
  {
    nom: "Aucune convention, petite entreprise",
    recherche: "danone", // IDCC 9999 -> pas d'OPCO
    taille: "0 à 10", // forcée pour obtenir la fourchette
    attendu: { opco: "OPCO non identifié", montant: "1 100 € – 8 000 €" },
  },
  {
    nom: "50 salariés et plus",
    recherche: "danone", // tranche 42 -> pré-rempli à « 50 et plus »
    taille: null,
    attendu: { opco: "OPCO non identifié", montant: "Sur étude" },
  },
]

const normaliser = (s) => s.replace(/\s+/g, " ").trim()

const browser = await chromium.launch({ executablePath, headless: true })
let echecs = 0

for (const cas of CAS) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } })
  const erreurs = []
  page.on("pageerror", (e) => erreurs.push(e.message))
  page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()))

  try {
    // Délai large : en dev, le premier chargement compile la page à froid.
    await page.goto(URL, { waitUntil: "networkidle", timeout: 120_000 })

    // Étape 1 — recherche (API Recherche d'entreprises en direct)
    await page.fill("#company-search", cas.recherche)
    // La liste de suggestions est un vrai « listbox » : on vise les options.
    const suggestion = page.getByRole("option").first()
    await suggestion.waitFor({ timeout: 15000 })
    await suggestion.click()

    // Étape 2 — détection + coordonnées
    await page.waitForSelector("text=Nous avons trouvé votre entreprise")
    const opco = normaliser(await page.locator("[data-slot='badge']").first().innerText())
    if (cas.taille) await page.getByRole("button", { name: cas.taille, exact: true }).click()
    await page.fill("#prenom", "Jean")
    await page.fill("#nom", "Dupont")
    await page.fill("#telephone", "0612345678")
    await page.fill("#email", "jean.dupont@example.com")
    // base-ui masque l'input natif : viser le rôle, pas l'id.
    await page.getByRole("checkbox").click()
    await page.getByRole("button", { name: "Voir mon budget" }).click()

    // Étape 3 — budget
    await page.waitForSelector("text=Votre budget formation", { timeout: 20000 })
    await page.waitForTimeout(600)
    const montant = normaliser(await page.locator("[data-slot='amount']").innerText())

    await page.getByRole("button", { name: "Être rappelé par un conseiller" }).click()
    const rappel = await page.locator("text=/un conseiller vous rappelle/").count()

    const ok =
      opco === cas.attendu.opco &&
      montant === cas.attendu.montant &&
      rappel === 1 &&
      erreurs.length === 0

    if (!ok) echecs++
    console.log(`${ok ? "✓" : "✗"} ${cas.nom}`)
    console.log(`    OPCO : ${opco} (attendu ${cas.attendu.opco})`)
    console.log(`    montant : ${montant} (attendu ${cas.attendu.montant})`)
    if (!rappel) console.log("    confirmation de rappel absente")
    if (erreurs.length) console.log(`    erreurs console : ${erreurs.join(" | ")}`)
  } catch (e) {
    echecs++
    console.log(`✗ ${cas.nom} — ${e.message.split("\n")[0]}`)
  } finally {
    await page.close()
  }
}

await browser.close()
console.log(echecs ? `\n${echecs} cas en échec` : "\nParcours OK")
process.exit(echecs ? 1 : 0)
