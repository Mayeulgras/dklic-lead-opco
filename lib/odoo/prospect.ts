import "server-only"

import { nomComplet, resumeDemande, resumeEnHtml, type Demande } from "../demande"
import type { AppelOdoo } from "./client"

/**
 * Enregistre une demande dans Odoo :
 * 1. la société (fiche contact « société », SIRET dans `company_registry`) ;
 * 2. la personne, rattachée à la société ;
 * 3. une opportunité CRM avec tout le détail de la simulation.
 *
 * Rien n'est créé en double : société retrouvée par SIRET ou SIREN, personne
 * par email au sein de la société, opportunité encore ouverte réutilisée. Les
 * fiches existantes ne sont pas modifiées : un commercial a pu les corriger.
 */

/** Début du nom des opportunités créées par le simulateur, qui permet aussi de les retrouver. */
export const PREFIXE_OPPORTUNITE = "Simulateur OPCO"
const NOM_ETIQUETTE = "Simulateur OPCO"

export interface ResultatOdoo {
  opportuniteId: number
  /** `false` quand une opportunité ouverte existait déjà pour ce contact. */
  nouvelle: boolean
}

type Enregistrement = { id: number }
type Domaine = [champ: string, operateur: string, valeur: unknown][]

async function chercherId(odoo: AppelOdoo, modele: string, domain: Domaine, order?: string) {
  const trouves = await odoo<Enregistrement[]>(modele, "search_read", {
    domain,
    fields: ["id"],
    limit: 1,
    ...(order ? { order } : {}),
  })
  return trouves[0]?.id ?? null
}

async function creer(odoo: AppelOdoo, modele: string, valeurs: Record<string, unknown>) {
  // `create` attend une liste et renvoie la liste des identifiants créés.
  const ids = await odoo<number[] | number>(modele, "create", { vals_list: [valeurs] })
  const id = Array.isArray(ids) ? ids[0] : ids
  if (typeof id !== "number") throw new Error(`Odoo n'a pas renvoyé d'identifiant pour ${modele}`)
  return id
}

/**
 * Pour les petits plus (pays, étiquette, activité) : un refus d'Odoo ne doit
 * pas faire échouer l'enregistrement du prospect lui-même.
 */
async function facultatif<T>(etape: string, action: () => Promise<T>): Promise<T | null> {
  try {
    return await action()
  } catch (erreur) {
    console.warn(`Odoo, étape facultative « ${etape} » ignorée :`, erreur)
    return null
  }
}

// Valeurs stables d'une instance : mémorisées une fois trouvées. Un échec
// n'est pas mémorisé, la demande suivante réessaiera.
let idFrance: number | null = null
let idEtiquette: number | null = null

async function paysFrance(odoo: AppelOdoo) {
  idFrance ??= await facultatif("pays France", () =>
    chercherId(odoo, "res.country", [["code", "=", "FR"]])
  )
  return idFrance
}

async function etiquette(odoo: AppelOdoo) {
  idEtiquette ??= await facultatif("étiquette", async () => {
    const existante = await chercherId(odoo, "crm.tag", [["name", "=", NOM_ETIQUETTE]])
    // Créer une étiquette demande le rôle « Administrateur » des ventes : sans
    // lui, l'opportunité est créée sans étiquette.
    return existante ?? (await creer(odoo, "crm.tag", { name: NOM_ETIQUETTE }))
  })
  return idEtiquette
}

/** Oublie les valeurs mémorisées (tests). */
export function reinitialiserCache() {
  idFrance = null
  idEtiquette = null
}

/** L'annuaire donne l'adresse complète ; Odoo range code postal et ville à part. */
function rue(adresse: string, codePostal: string, ville: string): string {
  const fin = ` ${codePostal} ${ville}`.toLocaleUpperCase("fr")
  return adresse.toLocaleUpperCase("fr").endsWith(fin) ? adresse.slice(0, -fin.length) : adresse
}

async function trouverOuCreerSociete(odoo: AppelOdoo, d: Demande, paysId: number | null) {
  const { company } = d
  const existante = await chercherId(odoo, "res.partner", [
    ["is_company", "=", true],
    ["company_registry", "in", [company.siret, company.siren]],
  ])
  if (existante) return existante

  return creer(odoo, "res.partner", {
    name: company.nom,
    is_company: true,
    company_registry: company.siret,
    street: rue(company.adresse, company.codePostal, company.ville),
    zip: company.codePostal,
    city: company.ville,
    ...(paysId ? { country_id: paysId } : {}),
  })
}

async function trouverOuCreerContact(odoo: AppelOdoo, d: Demande, societeId: number) {
  const { contact } = d
  const existant = await chercherId(odoo, "res.partner", [
    ["parent_id", "=", societeId],
    ["email", "=ilike", contact.email],
  ])
  if (existant) return existant

  return creer(odoo, "res.partner", {
    name: nomComplet(contact),
    parent_id: societeId,
    type: "contact",
    email: contact.email,
    phone: contact.telephone,
  })
}

/** Note interne dans l'historique de l'opportunité (texte brut, Odoo l'échappe). */
function noter(odoo: AppelOdoo, opportuniteId: number, texte: string) {
  return odoo("crm.lead", "message_post", {
    ids: [opportuniteId],
    body: texte,
    message_type: "comment",
    subtype_xmlid: "mail.mt_note",
  })
}

export async function enregistrerDansOdoo(
  d: Demande,
  odoo: AppelOdoo,
  options: { commercialId?: number } = {}
): Promise<ResultatOdoo> {
  const [paysId, etiquetteId] = await Promise.all([paysFrance(odoo), etiquette(odoo)])

  const societeId = await trouverOuCreerSociete(odoo, d, paysId)
  const contactId = await trouverOuCreerContact(odoo, d, societeId)
  const description = resumeEnHtml(resumeDemande(d))

  // Une opportunité du simulateur encore ouverte (ni gagnée, ni perdue) pour ce
  // contact : on la met à jour plutôt que d'en ouvrir une deuxième.
  const ouverte = await chercherId(
    odoo,
    "crm.lead",
    [
      ["partner_id", "=", contactId],
      ["name", "=like", `${PREFIXE_OPPORTUNITE}%`],
      ["stage_id.is_won", "=", false],
    ],
    "id desc"
  )

  let opportuniteId: number

  if (ouverte) {
    opportuniteId = ouverte
    await odoo("crm.lead", "write", { ids: [opportuniteId], vals: { description } })
    if (d.type === "simulation") {
      await noter(odoo, opportuniteId, "Nouvelle simulation faite sur le site : le détail a été mis à jour.")
    }
  } else {
    opportuniteId = await creer(odoo, "crm.lead", {
      name: `${PREFIXE_OPPORTUNITE} – ${d.company.nom}`,
      partner_id: contactId,
      partner_name: d.company.nom,
      contact_name: nomComplet(d.contact),
      email_from: d.contact.email,
      phone: d.contact.telephone,
      description,
      // Sans commercial désigné, l'opportunité reste « non attribuée » plutôt
      // que d'être attribuée à l'utilisateur technique qui la crée.
      user_id: options.commercialId ?? false,
      ...(etiquetteId ? { tag_ids: [[6, 0, [etiquetteId]]] } : {}),
    })
  }

  if (d.type === "rappel") {
    await noter(odoo, opportuniteId, "Le prospect demande à être rappelé par un conseiller.")

    if (options.commercialId) {
      await facultatif("activité de rappel", () =>
        odoo("crm.lead", "activity_schedule", {
          ids: [opportuniteId],
          act_type_xmlid: "mail.mail_activity_data_call",
          summary: `Rappeler ${nomComplet(d.contact)} (simulateur OPCO)`,
          note: `Téléphone : ${d.contact.telephone}`,
          user_id: options.commercialId,
        })
      )
    }
  }

  return { opportuniteId, nouvelle: !ouverte }
}

/** Lien direct vers l'opportunité, pour le mail de notification. */
export function lienOpportunite(urlOdoo: string, opportuniteId: number): string {
  return `${urlOdoo}/web#id=${opportuniteId}&model=crm.lead&view_type=form`
}
