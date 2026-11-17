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

import { SECTEURS, TOUS_SECTEURS } from "@/lib/formations/secteurs"
import {
  modeSecteurs,
  normaliserNom,
  POLES_PAR_SECTEUR,
  POLES_TRANSVERSAUX,
} from "@/lib/formations/selection"
import { configMail, transportMail } from "@/lib/mail/notification"
import { clientOdoo, configOdoo, type AppelOdoo } from "@/lib/odoo/client"
import { lireCatalogueOdoo } from "@/lib/odoo/formations"

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

  it.skipIf(!config)("catalogue des formations", async () => {
    const { formations } = await lireCatalogueOdoo(odoo, config!.url)
    assert.ok(formations.length > 0, "Aucun produit publié sur la boutique : pas de cartes formations")

    const parPole = new Map<string, number>()
    for (const f of formations) for (const p of f.poles) parPole.set(p, (parPole.get(p) ?? 0) + 1)
    console.log(`  ${formations.length} formations publiées`)
    for (const [pole, nombre] of parPole) console.log(`    ${pole} : ${nombre}`)

    if (!modeSecteurs(formations)) {
      console.log("  Mode « par pôles » : aucune formation n'est encore rangée sous « Secteurs » dans Odoo.")
      const connus = new Set([...parPole.keys()].map(normaliserNom))
      const prevus = new Set([...Object.values(POLES_PAR_SECTEUR).flat(), ...POLES_TRANSVERSAUX])
      const vides = [...prevus].filter((p) => !connus.has(normaliserNom(p)))
      if (vides.length) console.log(`  Pôles utilisés sans formation publiée : ${vides.join(", ")}`)
      return
    }

    console.log("  Mode « par secteurs » : dklic a rangé les formations par secteur.")
    const parSecteur = new Map<string, string[]>()
    for (const f of formations) for (const s of f.secteurs) parSecteur.set(s, [...(parSecteur.get(s) ?? []), f.nom])
    for (const [secteur, noms] of parSecteur) console.log(`    ${secteur} : ${noms.length}`)

    // Un secteur mal orthographié dans Odoo ne correspondrait à aucune entreprise.
    const attendus = new Set([...SECTEURS, TOUS_SECTEURS].map(normaliserNom))
    const inconnus = [...parSecteur.keys()].filter((s) => !attendus.has(normaliserNom(s)))
    assert.deepEqual(inconnus, [], `Secteurs inconnus dans Odoo (à renommer comme dans lib/formations/secteurs.ts) : ${inconnus.join(", ")}`)

    const sansSecteur = formations.filter((f) => f.secteurs.length === 0)
    if (sansSecteur.length) {
      console.log(`  Jamais proposées (aucun secteur, pas « Tous secteurs ») : ${sansSecteur.map((f) => f.nom).join(", ")}`)
    }
    const presents = new Set([...parSecteur.keys()].map(normaliserNom))
    const sansFormation = SECTEURS.filter((s) => !presents.has(normaliserNom(s)))
    if (sansFormation.length) {
      console.log(`  Secteurs sans formation ciblée (ils verront « Tous secteurs ») : ${sansFormation.join(", ")}`)
    }
  })

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
