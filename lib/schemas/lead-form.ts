import { z } from "zod"

export const companySchema = z.object({
  siren: z.string().regex(/^\d{9}$/, "SIREN invalide"),
  siret: z.string().regex(/^\d{14}$/, "SIRET invalide"),
  nom: z.string().min(1, "Raison sociale requise").max(200),
  adresse: z.string().max(300),
  codePostal: z.string().max(10),
  ville: z.string().max(150),
  codeNaf: z.string().max(10),
  effectif: z.string().nullable(),
})

export const contactSchema = z.object({
  prenom: z.string().min(1, "Prénom requis").max(100),
  nom: z.string().min(1, "Nom requis").max(100),
  telephone: z
    .string()
    .min(10, "Numéro de téléphone invalide")
    .max(20, "Numéro de téléphone invalide")
    .regex(/^[0-9+\s.-]+$/, "Numéro de téléphone invalide"),
  email: z.email("Email invalide").max(254),
  consentRgpd: z
    .boolean()
    .refine((v) => v === true, { message: "Le consentement est requis pour continuer" }),
})

/**
 * Forme brute renvoyée par l'API Recherche d'entreprises (DINUM). Validée à la
 * frontière plutôt que castée : un changement de contrat côté API doit produire
 * une erreur explicite, pas un `undefined` qui se propage jusqu'au rendu.
 */
export const rechercheEntreprisesResponseSchema = z.object({
  results: z
    .array(
      z.object({
        siren: z.string(),
        nom_complet: z.string(),
        tranche_effectif_salarie: z.string().nullish(),
        siege: z
          .object({
            siret: z.string(),
            adresse: z.string().nullish(),
            code_postal: z.string().nullish(),
            libelle_commune: z.string().nullish(),
            activite_principale: z.string().nullish(),
          })
          .nullish(),
      })
    )
    .default([]),
})

/** Réponse de la route de recherche, telle que consommée par le formulaire. */
export const searchResponseSchema = z.object({
  results: z.array(companySchema).optional(),
  error: z.string().optional(),
})

export type Company = z.infer<typeof companySchema>
export type ContactInfo = z.infer<typeof contactSchema>
export type SearchResponse = z.infer<typeof searchResponseSchema>

export interface OpcoResult {
  nom: string
  budgetMin: number
  budgetMax: number
}

export interface Formation {
  id: string
  nom: string
  description: string
}

export interface LeadFormData {
  company: Company | null
  contact: ContactInfo | null
}
