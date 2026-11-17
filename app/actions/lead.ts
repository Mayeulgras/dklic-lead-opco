"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { chargerCatalogue } from "@/lib/catalogue"
import { construireDemande, type FormationRetenue, type TypeDemande } from "@/lib/demande"
import { canauxDepuisEnvironnement, enregistrerDemande } from "@/lib/enregistrement"
import type { Taille } from "@/lib/financement/effectif"
import { clientKey, rateLimit } from "@/lib/rate-limit"
import { companySchema, contactSchema, type Company, type ContactInfo } from "@/lib/schemas/lead-form"

export type ResultatDemande = { ok: true } | { ok: false; error: string }

const tailleSchema = z.enum(["moins11", "de11a49", "plus50"])

/**
 * Chaque demande crée des fiches dans Odoo et envoie un mail : on bloque les
 * envois en rafale (robot, double clic insistant). Large pour un humain : une
 * simulation et un rappel, refaits plusieurs fois.
 */
const LIMITE = { limit: 10, windowMs: 10 * 60_000 }

const formationIdsSchema = z.array(z.number().int().positive()).max(20)

/**
 * Retrouve les formations cochées dans le catalogue : on ne reprend jamais un
 * nom envoyé par le navigateur. Si le catalogue ne répond pas, l'identifiant
 * suffit au conseiller pour retrouver la formation.
 */
async function formationsRetenues(ids: number[]): Promise<FormationRetenue[]> {
  if (!ids.length) return []
  const catalogue = await chargerCatalogue()

  return ids.flatMap((id) => {
    if (!catalogue) return [{ nom: `Formation n° ${id}`, url: "" }]
    const formation = catalogue.formations.find((f) => f.id === id)
    return formation ? [{ nom: formation.nom, url: formation.url }] : []
  })
}

async function traiter(
  type: TypeDemande,
  company: Company,
  contact: ContactInfo,
  taille: Taille,
  formationIds: number[] = []
): Promise<ResultatDemande> {
  // Tout ce qui arrive ici vient du navigateur : on revalide, même si le
  // formulaire a déjà fait sa propre vérification. Seules les données validées
  // (sans champ inconnu) sont transmises.
  const societe = companySchema.safeParse(company)
  if (!societe.success) {
    return { ok: false, error: "Les informations de l'entreprise sont invalides" }
  }

  const coordonnees = contactSchema.safeParse(contact)
  if (!coordonnees.success) {
    return { ok: false, error: "Vos coordonnées sont incomplètes ou invalides" }
  }

  const tailleValide = tailleSchema.safeParse(taille)
  if (!tailleValide.success) {
    return { ok: false, error: "Indiquez la taille de votre entreprise" }
  }

  const ids = formationIdsSchema.safeParse(formationIds)
  if (!ids.success) {
    return { ok: false, error: "La sélection de formations est invalide" }
  }

  const enProduction = process.env.NODE_ENV === "production"

  // Compteur distinct de celui de la recherche d'entreprises. Seulement en
  // ligne : en local, sans proxy, tous les essais partagent la même clé et
  // seraient bloqués au bout de quelques parcours.
  if (enProduction) {
    const { ok } = rateLimit(`demande:${clientKey(await headers())}`, LIMITE)
    if (!ok) {
      return { ok: false, error: "Trop de demandes envoyées, merci de réessayer dans quelques minutes" }
    }
  }

  const demande = construireDemande(type, societe.data, coordonnees.data, tailleValide.data, {
    formations: await formationsRetenues(ids.data),
  })
  const resultat = await enregistrerDemande(demande, canauxDepuisEnvironnement(), {
    simulation: !enProduction,
  })

  if (!resultat.ok) {
    return {
      ok: false,
      error: "Votre demande n'a pas pu être enregistrée, merci de réessayer dans un instant",
    }
  }

  return { ok: true }
}

/**
 * Point de passage obligé avant d'afficher le budget : enregistre le contact
 * dans Odoo et prévient l'équipe par mail. Le montant affiché, lui, se calcule
 * côté client (simple lecture de tableau).
 */
export async function soumettreDemande(
  company: Company,
  contact: ContactInfo,
  taille: Taille
): Promise<ResultatDemande> {
  return traiter("simulation", company, contact, taille)
}

/**
 * Clic sur « Être rappelé » : note et activité sur l'opportunité Odoo, et mail
 * à l'équipe, avec les formations cochées « M'intéresse ».
 */
export async function demanderRappel(
  company: Company,
  contact: ContactInfo,
  taille: Taille,
  formationIds: number[] = []
): Promise<ResultatDemande> {
  return traiter("rappel", company, contact, taille, formationIds)
}
