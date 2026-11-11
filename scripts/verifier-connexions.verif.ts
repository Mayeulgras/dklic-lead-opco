/**
 * Vérifie les accès à Odoo et au serveur mail, SANS RIEN CRÉER NI ENVOYER.
 * À lancer dès que les accès sont renseignés dans `.env.local` :
 *
 *   npm run verifier
 *
 * Chaque ligne verte est un point acquis ; une ligne rouge dit quoi corriger.
 * Ensuite, `npm run essai-envoi` fait un vrai envoi de bout en bout.
 */
import assert from "node:assert/strict"
import { beforeAll, describe, it } from "vitest"

import { configMail, transportMail } from "@/lib/mail/notification"
import { clientOdoo, configOdoo, type AppelOdoo } from "@/lib/odoo/client"

try {
  process.loadEnvFile(".env.local")
} catch {
  // Pas de fichier : les variables viennent déjà de l'environnement.
}

/** Les champs que le simulateur remplit ; s'il en manque un, Odoo refusera l'envoi. */
const CHAMPS_UTILISES = {
  "res.partner": ["name", "is_company", "company_registry", "parent_id", "type", "street", "zip", "city", "country_id", "email", "phone"],
  "crm.lead": ["name", "partner_id", "partner_name", "contact_name", "email_from", "phone", "description", "user_id", "tag_ids", "stage_id"],
}

describe("Odoo", () => {
  const config = configOdoo()
  let odoo: AppelOdoo

  beforeAll(() => {
    if (config) odoo = clientOdoo(config)
  })

  it("configuration présente (ODOO_URL, ODOO_API_KEY)", () => {
    assert.ok(config, "Renseignez ODOO_URL et ODOO_API_KEY dans .env.local (voir .env.example)")
  })

  it.skipIf(!config)("version 19 ou plus (API JSON-2 disponible)", async () => {
    const reponse = await fetch(`${config!.url}/web/webclient/version_info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: {} }),
    })
    const { result } = (await reponse.json()) as { result: { server_version: string; server_version_info: [number] } }
    console.log(`  Odoo ${result.server_version}`)
    assert.ok(result.server_version_info[0] >= 19, "L'API JSON-2 demande Odoo 19 ou plus")
  })

  it.skipIf(!config)("clé API acceptée", async () => {
    const nombre = await odoo<number>("res.partner", "search_count", { domain: [] })
    console.log(`  ${nombre} contacts visibles`)
  })

  for (const [modele, champs] of Object.entries(CHAMPS_UTILISES)) {
    it.skipIf(!config)(`champs de ${modele} présents`, async () => {
      const existants = await odoo<Record<string, unknown>>(modele, "fields_get", { attributes: ["type"] })
      const manquants = champs.filter((c) => !(c in existants))
      assert.deepEqual(manquants, [], `Champs absents de ${modele} : ${manquants.join(", ")}`)
    })
  }

  for (const [modele, operation] of [
    ["res.partner", "create"],
    ["crm.lead", "create"],
    ["crm.lead", "write"],
  ] as const) {
    it.skipIf(!config)(`droit « ${operation} » sur ${modele}`, async () => {
      let autorise: boolean
      try {
        autorise = await odoo<boolean>(modele, "has_access", { ids: [], operation })
      } catch (erreur) {
        // Contrôle de confort : s'il n'est pas permis, l'essai d'envoi tranchera.
        console.log(`  impossible à vérifier ici (${(erreur as Error).message}) : voir npm run essai-envoi`)
        return
      }
      assert.equal(autorise, true, `L'utilisateur de la clé API ne peut pas faire « ${operation} » sur ${modele}`)
    })
  }

  it.skipIf(!config)("étiquette « Simulateur OPCO » (facultatif)", async () => {
    const [etiquette] = await odoo<{ id: number }[]>("crm.tag", "search_read", {
      domain: [["name", "=", "Simulateur OPCO"]],
      fields: ["id"],
      limit: 1,
    })
    if (etiquette) {
      console.log(`  étiquette trouvée (id ${etiquette.id})`)
      return
    }
    const peutCreer = await odoo<boolean>("crm.tag", "has_access", { ids: [], operation: "create" }).catch(() => false)
    console.log(
      peutCreer
        ? "  étiquette absente : elle sera créée au premier envoi"
        : "  étiquette absente et pas le droit de la créer : créez « Simulateur OPCO » dans CRM > Configuration > Étiquettes"
    )
  })

  it.skipIf(!config)("commercial qui reçoit les opportunités (facultatif)", async () => {
    if (config!.commercialId) {
      const [commercial] = await odoo<{ name: string }[]>("res.users", "search_read", {
        domain: [["id", "=", config!.commercialId]],
        fields: ["name"],
      })
      assert.ok(commercial, `Aucun utilisateur Odoo avec l'identifiant ${config!.commercialId}`)
      console.log(`  opportunités attribuées à ${commercial.name}`)
      return
    }

    const utilisateurs = await odoo<{ id: number; name: string; login: string }[]>("res.users", "search_read", {
      domain: [["share", "=", false]],
      fields: ["id", "name", "login"],
    })
    console.log("  ODOO_COMMERCIAL_ID non renseigné : les opportunités resteront non attribuées.")
    console.log("  Utilisateurs possibles :")
    for (const u of utilisateurs) console.log(`    ${u.id}  ${u.name} (${u.login})`)
  })
})

describe("Mail", () => {
  const config = configMail()

  it("configuration présente (SMTP_HOST, SMTP_USER, SMTP_PASSWORD, MAIL_DESTINATAIRE)", () => {
    assert.ok(config, "Renseignez les variables SMTP et MAIL_DESTINATAIRE dans .env.local (voir .env.example)")
  })

  it.skipIf(!config)("connexion et identifiants SMTP acceptés", async () => {
    await transportMail(config!).verify()
    console.log(`  ${config!.hote}:${config!.port}, envoi de ${config!.expediteur} vers ${config!.destinataire}`)
  })
})
