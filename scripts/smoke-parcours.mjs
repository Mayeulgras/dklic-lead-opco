/**
 * Vérification de bout en bout du parcours, dans un vrai navigateur.
 *
 * Complète les tests unitaires de `lib/financement/` : ceux-ci prouvent que le
 * calcul est juste, celui-ci prouve que l'interface le branche correctement
 * (curseurs, écrêtage affiché, absence d'erreur console).
 *
 * Prérequis : `npm run dev` dans un autre terminal, et Chrome installé.
 * Usage : node scripts/smoke-parcours.mjs [url] [chemin-capture]
 */
import { chromium } from "playwright-core"

const URL = process.argv[2] ?? "http://localhost:3000/"
const CAPTURE = process.argv[3] ?? null

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]

const { existsSync } = await import("node:fs")
const executablePath = CHROME.find((p) => existsSync(p))

if (!executablePath) {
  console.error("Aucun navigateur trouvé. Renseignez un chemin dans CHROME.")
  process.exit(1)
}

const browser = await chromium.launch({ executablePath, headless: true })
// <main> est un conteneur scrollable : un viewport court sort les contrôles du
// champ visible et bloque les clics.
const page = await browser.newPage({ viewport: { width: 1000, height: 1600 } })

const erreurs = []
page.on("pageerror", (e) => erreurs.push(`pageerror: ${e.message}`))
page.on("console", (m) => m.type() === "error" && erreurs.push(`console: ${m.text()}`))

await page.goto(URL, { waitUntil: "networkidle" })

// Étape 1 — recherche entreprise (API Recherche d'entreprises en direct)
await page.fill("#company-search", "danone")
await page.waitForSelector("ul li button", { timeout: 15000 })
await page.locator("ul li button").first().click()

// Étape 2 — confirmation
await page.waitForSelector("#siret")
console.log(`E2 SIRET prérempli -> ${await page.inputValue("#siret")}`)
await page.getByRole("button", { name: "Confirmer" }).click()

// Étape 3 — contact. base-ui masque l'input natif : viser le rôle, pas l'id.
await page.waitForSelector("#prenom")
await page.fill("#prenom", "Jean")
await page.fill("#nom", "Dupont")
await page.fill("#telephone", "0612345678")
await page.fill("#email", "jean.dupont@example.com")
await page.getByRole("checkbox").click()
await page.getByRole("button", { name: "Voir mon résultat" }).click()

// Étape 4 — simulateur
await page.waitForSelector("text=Votre financement formation", { timeout: 20000 })

const montant = async () =>
  (await page.locator("span.text-4xl").first().innerText()).trim()
const apprenants = async () =>
  (await page.locator("span.text-sm.font-medium.tabular-nums").first().innerText()).trim()
const plafond = async () => {
  const l = page.locator("text=/ramené au plafond/")
  return (await l.count()) ? (await l.first().innerText()).replace(/\s+/g, " ") : "aucun"
}

console.log(`E4 départ -> ${await montant()} (${await apprenants()} apprenants)`)
console.log(`   écrêtage -> ${await plafond()}`)

for (const j of ["1 jour", "2 jours", "3 jours"]) {
  await page.getByRole("button", { name: j, exact: true }).click()
  await page.waitForTimeout(150)
  console.log(`   ${j} -> ${await montant()}`)
}

// L'élément focusable du slider est l'<input type="range"> interne : le div du
// thumb n'a ni role ni tabindex.
const curseur = page.locator('[data-slot="slider"] input').first()
if (await curseur.count()) {
  await curseur.focus()
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press("ArrowLeft")
    await page.waitForTimeout(60)
  }
  console.log(`   curseur -> ${await apprenants()} apprenants = ${await montant()}`)
  console.log(`   écrêtage après baisse -> ${await plafond()}`)
}

if (CAPTURE) {
  await page.screenshot({ path: CAPTURE, fullPage: true })
  console.log(`\nCapture : ${CAPTURE}`)
}

console.log(`Erreurs console : ${erreurs.length ? erreurs.join(" | ") : "aucune"}`)

await browser.close()
process.exit(erreurs.length ? 1 : 0)
