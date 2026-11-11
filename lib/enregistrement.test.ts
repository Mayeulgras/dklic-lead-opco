import assert from "node:assert/strict"
import { beforeEach, describe, it, vi } from "vitest"

import { demandeExemple } from "@/test/demande-exemple"
import { enregistrerDemande, type Canaux } from "./enregistrement"
import type { EtatOdoo } from "./mail/notification"

const LIEN = "https://dklic.odoo.com/web#id=42&model=crm.lead&view_type=form"
const odooOk: NonNullable<Canaux["odoo"]> = async () => ({ opportuniteId: 42, nouvelle: true, lien: LIEN })
const odooEnPanne: NonNullable<Canaux["odoo"]> = async () => {
  throw new Error("Clé API Odoo refusée")
}
const mailEnPanne: NonNullable<Canaux["mail"]> = async () => {
  throw new Error("SMTP indisponible")
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.spyOn(console, "info").mockImplementation(() => {})
})

describe("enregistrerDemande", () => {
  it("enregistre dans Odoo puis envoie le mail avec le lien de l'opportunité", async () => {
    const mailsRecus: EtatOdoo[] = []
    const resultat = await enregistrerDemande(
      demandeExemple(),
      { odoo: odooOk, mail: async (_d, etat) => void mailsRecus.push(etat) },
      { simulation: false }
    )

    assert.deepEqual(resultat, { ok: true, odoo: { statut: "enregistre", lien: LIEN, nouvelle: true }, mail: "envoye" })
    assert.deepEqual(mailsRecus, [{ statut: "enregistre", lien: LIEN, nouvelle: true }])
  })

  it("sauve la demande par le mail quand Odoo est en panne, et le mail le signale", async () => {
    const mailsRecus: EtatOdoo[] = []
    const resultat = await enregistrerDemande(
      demandeExemple(),
      { odoo: odooEnPanne, mail: async (_d, etat) => void mailsRecus.push(etat) },
      { simulation: false }
    )

    assert.equal(resultat.ok, true)
    assert.deepEqual(mailsRecus, [{ statut: "echec", raison: "Clé API Odoo refusée" }])
  })

  it("se contente d'Odoo quand le mail échoue", async () => {
    const resultat = await enregistrerDemande(demandeExemple(), { odoo: odooOk, mail: mailEnPanne }, { simulation: false })
    assert.equal(resultat.ok, true)
    assert.equal(resultat.mail, "echec")
  })

  it("refuse quand les deux canaux échouent : le visiteur doit pouvoir réessayer", async () => {
    const resultat = await enregistrerDemande(
      demandeExemple(),
      { odoo: odooEnPanne, mail: mailEnPanne },
      { simulation: false }
    )
    assert.equal(resultat.ok, false)
  })

  it("simule les canaux non configurés en développement", async () => {
    const resultat = await enregistrerDemande(demandeExemple(), { odoo: null, mail: null }, { simulation: true })
    assert.deepEqual(resultat, { ok: true, odoo: { statut: "simule" }, mail: "simule" })
  })

  it("compte un canal non configuré comme un échec en production", async () => {
    const resultat = await enregistrerDemande(demandeExemple(), { odoo: null, mail: null }, { simulation: false })
    assert.equal(resultat.ok, false)
    assert.deepEqual(resultat.odoo, { statut: "echec", raison: "Odoo n'est pas configuré" })
  })
})
