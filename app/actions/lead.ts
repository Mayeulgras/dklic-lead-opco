"use server"

import {
  companySchema,
  type Company,
  type Formation,
  type OpcoResult,
} from "@/lib/schemas/lead-form"
import { getMockResult } from "@/lib/mock-opco-result"

export type LeadResult =
  | { ok: true; opco: OpcoResult; formations: Formation[] }
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

  // TODO: remplacer par l'appel à la route d'orchestration backend qui agrège
  // OPCO/budget (API CFADock) + catalogue Odoo, et crée le lead CRM.
  const { opco, formations } = getMockResult(parsed.data)

  return { ok: true, opco, formations }
}
