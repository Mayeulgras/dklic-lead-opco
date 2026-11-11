import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { clientOdoo, configOdoo, ErreurOdoo } from "./client"

describe("configOdoo", () => {
  it("reste vide tant que l'adresse ou la clé manque", () => {
    assert.equal(configOdoo({}), null)
    assert.equal(configOdoo({ ODOO_URL: "https://x.odoo.com" }), null)
    assert.equal(configOdoo({ ODOO_API_KEY: "cle" }), null)
  })

  it("nettoie l'adresse et lit les réglages facultatifs", () => {
    assert.deepEqual(
      configOdoo({
        ODOO_URL: " https://dklic.odoo.com/ ",
        ODOO_API_KEY: " cle ",
        ODOO_DB: "dklic",
        ODOO_COMMERCIAL_ID: "7",
      }),
      { url: "https://dklic.odoo.com", cleApi: "cle", base: "dklic", commercialId: 7 }
    )
  })

  it("ignore un identifiant de commercial invalide", () => {
    const config = configOdoo({ ODOO_URL: "https://x", ODOO_API_KEY: "c", ODOO_COMMERCIAL_ID: "abc" })
    assert.equal(config?.commercialId, undefined)
  })
})

function fauxFetch(statut: number, corps: unknown) {
  const requetes: { url: string; init: RequestInit }[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    requetes.push({ url, init })
    return new Response(typeof corps === "string" ? corps : JSON.stringify(corps), { status: statut })
  }) as unknown as typeof fetch
  return { fetchImpl, requetes }
}

describe("clientOdoo", () => {
  const config = { url: "https://dklic.odoo.com", cleApi: "secret" }

  it("appelle /json/2/<modèle>/<méthode> avec la clé et les arguments nommés", async () => {
    const { fetchImpl, requetes } = fauxFetch(200, [{ id: 3 }])
    const odoo = clientOdoo({ ...config, base: "dklic" }, fetchImpl)

    const resultat = await odoo("res.partner", "search_read", { domain: [["id", "=", 3]], fields: ["id"] })

    assert.deepEqual(resultat, [{ id: 3 }])
    assert.equal(requetes[0].url, "https://dklic.odoo.com/json/2/res.partner/search_read")
    assert.equal(requetes[0].init.method, "POST")
    const entetes = requetes[0].init.headers as Record<string, string>
    assert.equal(entetes.Authorization, "bearer secret")
    assert.equal(entetes["X-Odoo-Database"], "dklic")
    assert.deepEqual(JSON.parse(requetes[0].init.body as string), {
      domain: [["id", "=", 3]],
      fields: ["id"],
    })
  })

  it("n'envoie pas d'en-tête de base quand il n'y en a qu'une", async () => {
    const { fetchImpl, requetes } = fauxFetch(200, [])
    await clientOdoo(config, fetchImpl)("res.partner", "search_read")
    assert.equal((requetes[0].init.headers as Record<string, string>)["X-Odoo-Database"], undefined)
  })

  it("explique une clé refusée (souvent expirée)", async () => {
    const { fetchImpl } = fauxFetch(401, { name: "werkzeug.exceptions.Unauthorized", message: "Invalid apikey" })
    await assert.rejects(clientOdoo(config, fetchImpl)("crm.lead", "create"), (e: unknown) => {
      assert.ok(e instanceof ErreurOdoo)
      assert.equal(e.statut, 401)
      assert.match(e.message, /Clé API Odoo refusée.*Invalid apikey/)
      return true
    })
  })

  it("explique un manque de droits", async () => {
    const { fetchImpl } = fauxFetch(403, { message: "Access denied" })
    await assert.rejects(clientOdoo(config, fetchImpl)("crm.tag", "create"), /Droits Odoo insuffisants pour crm.tag\/create/)
  })

  it("signale un Odoo injoignable", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("fetch failed")
    }) as unknown as typeof fetch
    await assert.rejects(clientOdoo(config, fetchImpl)("res.partner", "search_read"), /Odoo injoignable.*fetch failed/)
  })
})
