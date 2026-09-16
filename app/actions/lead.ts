"use server"

import {
  companySchema,
  contactSchema,
  type Company,
  type ContactInfo,
} from "@/lib/schemas/lead-form"

export type ResultatDemande = { ok: true } | { ok: false; error: string }

/**
 * Point de passage obligé avant d'afficher le budget : c'est ici que le contact
 * sera enregistré. Le montant, lui, se calcule côté client (simple lecture de
 * tableau), il n'a pas besoin du serveur.
 */
export async function soumettreDemande(
  company: Company,
  contact: ContactInfo
): Promise<ResultatDemande> {
  // Tout ce qui arrive ici vient du navigateur : on revalide, même si le
  // formulaire a déjà fait sa propre vérification.
  if (!companySchema.safeParse(company).success) {
    return { ok: false, error: "Les informations de l'entreprise sont invalides" }
  }

  if (!contactSchema.safeParse(contact).success) {
    return { ok: false, error: "Vos coordonnées sont incomplètes ou invalides" }
  }

  // TODO: créer le lead dans le CRM Odoo (entreprise, contact, OPCO, taille).
  return { ok: true }
}
