import { construireDemande, type TypeDemande } from "@/lib/demande"
import type { Taille } from "@/lib/financement/effectif"
import type { Company, ContactInfo } from "@/lib/schemas/lead-form"

export const SOCIETE: Company = {
  siren: "123456789",
  siret: "12345678900012",
  nom: "BOULANGERIE MARTIN",
  adresse: "12 RUE DE LA PAIX 75002 PARIS",
  codePostal: "75002",
  ville: "PARIS",
  codeNaf: "10.71C",
  effectif: "01",
  idcc: ["3253"], // OPCO EP
}

export const CONTACT: ContactInfo = {
  prenom: "Jean",
  nom: "Dupont",
  telephone: "06 12 34 56 78",
  email: "jean.dupont@example.com",
  consentRgpd: true,
}

/** 11 novembre 2026, 15 h 30 à Paris. */
export const DATE = new Date("2026-11-11T14:30:00Z")

export function demandeExemple(
  type: TypeDemande = "simulation",
  surcharge: { company?: Partial<Company>; contact?: Partial<ContactInfo>; taille?: Taille } = {}
) {
  return construireDemande(
    type,
    { ...SOCIETE, ...surcharge.company },
    { ...CONTACT, ...surcharge.contact },
    surcharge.taille ?? "moins11",
    DATE
  )
}
