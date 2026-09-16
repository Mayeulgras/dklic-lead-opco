"use server"

import {
  companySchema,
  type Company,
  type Formation,
} from "@/lib/schemas/lead-form"
import { FORMATIONS_DEMO } from "@/lib/formations-demo"
import { resoudreOpco } from "@/lib/financement/opco-resolution"
import type { OpcoId } from "@/lib/financement/opcos"

export interface DonneesResultat {
  /**
   * OPCO de rattachement, résolu depuis l'IDCC de l'entreprise. `null` quand
   * aucune convention exploitable n'est déclarée — cas fréquent : le simulateur
   * retombe alors sur le barème moyen, et l'interface le dit.
   * Ne jamais inventer d'OPCO ici : il détermine le forfait horaire.
   */
  opco: OpcoId | null
  formations: Formation[]
}

export type LeadResult =
  | ({ ok: true } & DonneesResultat)
  | { ok: false; error: string }

export async function getLeadResult(company: Company): Promise<LeadResult> {
  // L'entreprise est éditable à l'étape 2 : ce qui arrive ici vient du client et
  // doit être revalidé, même si le formulaire a déjà fait sa propre vérification.
  const parsed = companySchema.safeParse(company)

  if (!parsed.success) {
    return {
      ok: false,
      error: "Les informations de l'entreprise sont incomplètes ou invalides",
    }
  }

  // TODO: créer le lead dans le CRM Odoo avec les données collectées.
  // Le montant, lui, est calculé côté client par `lib/financement/` : il réagit
  // aux curseurs du simulateur sans aller-retour serveur.
  return {
    ok: true,
    opco: resoudreOpco(parsed.data.idcc),
    formations: FORMATIONS_DEMO,
  }
}
