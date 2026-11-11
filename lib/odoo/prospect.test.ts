import assert from "node:assert/strict"
import { beforeEach, describe, it, vi } from "vitest"

import { demandeExemple } from "@/test/demande-exemple"
import type { AppelOdoo } from "./client"
import { enregistrerDansOdoo, lienOpportunite, reinitialiserCache } from "./prospect"

type Fiche = Record<string, unknown> & { id: number }
type Condition = [string, string, unknown]

/** Un Odoo en mémoire, qui comprend juste ce que le simulateur lui demande. */
function fauxOdoo(depart: Partial<Record<string, Fiche[]>> = {}, refus: string[] = []) {
  const tables: Record<string, Fiche[]> = {
    "res.country": [{ id: 75, code: "FR" }],
    "res.partner": [],
    "crm.lead": [],
    "crm.tag": [],
    ...depart,
  }
  const notes: { id: number; body: string }[] = []
  const activites: Record<string, unknown>[] = []
  let prochainId = 100

  const verifie = (fiche: Fiche, [champ, operateur, valeur]: Condition) => {
    if (champ === "stage_id.is_won") return (fiche.gagnee ?? false) === valeur
    const actuel = fiche[champ] ?? false
    switch (operateur) {
      case "=":
        return actuel === valeur
      case "in":
        return (valeur as unknown[]).includes(actuel)
      case "=ilike":
        return String(actuel).toLowerCase() === String(valeur).toLowerCase()
      case "=like":
        return String(actuel).startsWith(String(valeur).replace(/%$/, ""))
      default:
        throw new Error(`opérateur non géré : ${operateur}`)
    }
  }

  const odoo: AppelOdoo = async <T,>(modele: string, methode: string, p: Record<string, unknown> = {}) => {
    if (refus.includes(`${modele}/${methode}`)) throw new Error(`refus ${modele}/${methode}`)
    const table = tables[modele]

    switch (methode) {
      case "search_read": {
        const domaine = p.domain as Condition[]
        let trouves = table.filter((f) => domaine.every((c) => verifie(f, c)))
        if (p.order === "id desc") trouves = [...trouves].sort((a, b) => b.id - a.id)
        return trouves.slice(0, p.limit as number).map((f) => ({ id: f.id })) as T
      }
      case "create": {
        const ids = (p.vals_list as Record<string, unknown>[]).map((vals) => {
          const id = prochainId++
          table.push({ ...vals, id })
          return id
        })
        return ids as T
      }
      case "write": {
        for (const id of p.ids as number[]) Object.assign(table.find((f) => f.id === id)!, p.vals)
        return true as T
      }
      case "message_post":
        notes.push({ id: (p.ids as number[])[0], body: p.body as string })
        return 1 as T
      case "activity_schedule":
        activites.push(p)
        return [1] as T
      default:
        throw new Error(`méthode non gérée : ${methode}`)
    }
  }

  return { odoo: vi.fn(odoo) as unknown as AppelOdoo, tables, notes, activites }
}

beforeEach(() => {
  reinitialiserCache()
  vi.spyOn(console, "warn").mockImplementation(() => {})
})

describe("enregistrerDansOdoo — nouveau prospect", () => {
  it("crée la société, la personne et l'opportunité", async () => {
    const { odoo, tables } = fauxOdoo()
    const resultat = await enregistrerDansOdoo(demandeExemple(), odoo)

    const [societe, personne] = tables["res.partner"]
    assert.deepEqual(societe, {
      id: societe.id,
      name: "BOULANGERIE MARTIN",
      is_company: true,
      company_registry: "12345678900012",
      street: "12 RUE DE LA PAIX",
      zip: "75002",
      city: "PARIS",
      country_id: 75,
    })
    assert.deepEqual(personne, {
      id: personne.id,
      name: "Jean Dupont",
      parent_id: societe.id,
      type: "contact",
      email: "jean.dupont@example.com",
      phone: "06 12 34 56 78",
    })

    const [opportunite] = tables["crm.lead"]
    assert.equal(opportunite.name, "Simulateur OPCO – BOULANGERIE MARTIN")
    assert.equal(opportunite.partner_id, personne.id)
    assert.equal(opportunite.email_from, "jean.dupont@example.com")
    assert.equal(opportunite.user_id, false, "non attribuée plutôt qu'attribuée au compte technique")
    assert.match(String(opportunite.description), /4\s200\s€/)

    const [etiquette] = tables["crm.tag"]
    assert.equal(etiquette.name, "Simulateur OPCO")
    assert.deepEqual(opportunite.tag_ids, [[6, 0, [etiquette.id]]])

    assert.deepEqual(resultat, { opportuniteId: opportunite.id, nouvelle: true })
  })

  it("attribue l'opportunité au commercial choisi", async () => {
    const { odoo, tables } = fauxOdoo()
    await enregistrerDansOdoo(demandeExemple(), odoo, { commercialId: 7 })
    assert.equal(tables["crm.lead"][0].user_id, 7)
  })

  it("crée l'opportunité sans étiquette si Odoo refuse de créer l'étiquette", async () => {
    const { odoo, tables } = fauxOdoo({}, ["crm.tag/create"])
    await enregistrerDansOdoo(demandeExemple(), odoo)
    assert.equal(tables["crm.lead"].length, 1)
    assert.equal(tables["crm.lead"][0].tag_ids, undefined)
  })

  it("échoue franchement si la société ne peut pas être créée", async () => {
    const { odoo } = fauxOdoo({}, ["res.partner/create"])
    await assert.rejects(enregistrerDansOdoo(demandeExemple(), odoo), /refus res.partner\/create/)
  })
})

describe("enregistrerDansOdoo — pas de doublon", () => {
  it("retrouve la société par son SIREN et la personne par son email, sans les modifier", async () => {
    const { odoo, tables } = fauxOdoo({
      "res.partner": [
        { id: 1, name: "Boulangerie Martin (corrigée)", is_company: true, company_registry: "123456789" },
        { id: 2, name: "J. Dupont", parent_id: 1, email: "Jean.Dupont@Example.com" },
      ],
    })
    await enregistrerDansOdoo(demandeExemple(), odoo)

    assert.equal(tables["res.partner"].length, 2)
    assert.equal(tables["res.partner"][0].name, "Boulangerie Martin (corrigée)")
    assert.equal(tables["crm.lead"][0].partner_id, 2)
  })

  it("met à jour l'opportunité encore ouverte au lieu d'en créer une autre", async () => {
    const { odoo, tables, notes } = fauxOdoo({
      "res.partner": [
        { id: 1, is_company: true, company_registry: "12345678900012" },
        { id: 2, parent_id: 1, email: "jean.dupont@example.com" },
      ],
      "crm.lead": [{ id: 50, name: "Simulateur OPCO – BOULANGERIE MARTIN", partner_id: 2, description: "ancienne" }],
    })
    const resultat = await enregistrerDansOdoo(demandeExemple("simulation", { taille: "de11a49" }), odoo)

    assert.deepEqual(resultat, { opportuniteId: 50, nouvelle: false })
    assert.equal(tables["crm.lead"].length, 1)
    assert.match(String(tables["crm.lead"][0].description), /11 à 49 salariés/)
    assert.match(notes[0].body, /Nouvelle simulation/)
  })

  it("ouvre une nouvelle opportunité si la précédente est gagnée", async () => {
    const { odoo, tables } = fauxOdoo({
      "res.partner": [
        { id: 1, is_company: true, company_registry: "12345678900012" },
        { id: 2, parent_id: 1, email: "jean.dupont@example.com" },
      ],
      "crm.lead": [{ id: 50, name: "Simulateur OPCO – BOULANGERIE MARTIN", partner_id: 2, gagnee: true }],
    })
    const resultat = await enregistrerDansOdoo(demandeExemple(), odoo)
    assert.equal(resultat.nouvelle, true)
    assert.equal(tables["crm.lead"].length, 2)
  })
})

describe("enregistrerDansOdoo — demande de rappel", () => {
  it("laisse une note et une activité « appeler » au commercial", async () => {
    const { odoo, notes, activites } = fauxOdoo()
    const { opportuniteId } = await enregistrerDansOdoo(demandeExemple("rappel"), odoo, { commercialId: 7 })

    assert.deepEqual(notes, [{ id: opportuniteId, body: "Le prospect demande à être rappelé par un conseiller." }])
    assert.equal(activites[0].act_type_xmlid, "mail.mail_activity_data_call")
    assert.equal(activites[0].user_id, 7)
    assert.match(String(activites[0].note), /06 12 34 56 78/)
  })

  it("se contente de la note quand aucun commercial n'est désigné", async () => {
    const { odoo, notes, activites } = fauxOdoo()
    await enregistrerDansOdoo(demandeExemple("rappel"), odoo)
    assert.equal(notes.length, 1)
    assert.equal(activites.length, 0)
  })

  it("garde la note même si Odoo refuse l'activité", async () => {
    const { odoo, notes } = fauxOdoo({}, ["crm.lead/activity_schedule"])
    await enregistrerDansOdoo(demandeExemple("rappel"), odoo, { commercialId: 7 })
    assert.equal(notes.length, 1)
  })
})

it("construit le lien vers l'opportunité", () => {
  assert.equal(
    lienOpportunite("https://dklic.odoo.com", 42),
    "https://dklic.odoo.com/web#id=42&model=crm.lead&view_type=form"
  )
})
