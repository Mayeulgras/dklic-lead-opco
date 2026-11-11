/**
 * Une « demande », c'est tout ce que le visiteur a laissé : son entreprise, ses
 * coordonnées, la taille choisie, et ce que le simulateur lui a annoncé. C'est
 * ce qui part dans Odoo et dans le mail de notification.
 *
 * L'OPCO et le budget sont recalculés ici, côté serveur, à partir des données
 * validées : on ne fait pas confiance à un montant envoyé par le navigateur.
 */

import { budgetAnnuel, formaterBudget, type Budget } from "./financement/budget"
import { libelleTaille, type Taille } from "./financement/effectif"
import { resoudreOpco } from "./financement/opco-resolution"
import { libelleOpco, type OpcoId } from "./financement/opcos"
import type { Company, ContactInfo } from "./schemas/lead-form"

/** `simulation` : coordonnées laissées pour voir le budget. `rappel` : clic sur « Être rappelé ». */
export type TypeDemande = "simulation" | "rappel"

export interface Demande {
  type: TypeDemande
  company: Company
  contact: ContactInfo
  taille: Taille
  opco: OpcoId | null
  budget: Budget
  /** Moment de l'envoi, qui fait foi pour le consentement RGPD. */
  date: Date
}

export function construireDemande(
  type: TypeDemande,
  company: Company,
  contact: ContactInfo,
  taille: Taille,
  date = new Date()
): Demande {
  const opco = resoudreOpco(company.idcc)
  return { type, company, contact, taille, opco, budget: budgetAnnuel(opco, taille), date }
}

export function nomComplet(contact: ContactInfo): string {
  return `${contact.prenom} ${contact.nom}`.trim()
}

const dateHeure = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
})

export interface SectionResume {
  titre: string
  lignes: [libelle: string, valeur: string][]
}

/** Le contenu de la demande, rangé pour être lu par un conseiller. */
export function resumeDemande(d: Demande): SectionResume[] {
  const { company, contact } = d

  return [
    {
      titre: "Contact",
      lignes: [
        ["Nom", nomComplet(contact)],
        ["Téléphone", contact.telephone],
        ["Email", contact.email],
      ],
    },
    {
      titre: "Entreprise",
      lignes: [
        ["Raison sociale", company.nom],
        ["SIRET", company.siret],
        ["SIREN", company.siren],
        ["Adresse", company.adresse || "Non renseignée"],
        ["Code NAF", company.codeNaf || "Non renseigné"],
        ["Conventions collectives (IDCC)", company.idcc.join(", ") || "Aucune déclarée"],
      ],
    },
    {
      titre: "Simulation",
      lignes: [
        ["OPCO", d.opco ? libelleOpco(d.opco) : "Non identifié"],
        ["Taille indiquée", libelleTaille(d.taille)],
        ["Budget annoncé", formaterBudget(d.budget)],
        ["Rappel demandé", d.type === "rappel" ? "Oui" : "Non"],
      ],
    },
    {
      titre: "Consentement",
      lignes: [["Accepté le", dateHeure.format(d.date)]],
    },
  ]
}

export function resumeEnTexte(sections: SectionResume[]): string {
  return sections
    .map(({ titre, lignes }) =>
      [titre.toUpperCase(), ...lignes.map(([libelle, valeur]) => `${libelle} : ${valeur}`)].join("\n")
    )
    .join("\n\n")
}

/** Toute valeur saisie par le visiteur passe par ici avant d'entrer dans du HTML. */
export function echapperHtml(texte: string): string {
  return texte
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

/** Version HTML, pour le mail et la description de l'opportunité Odoo. */
export function resumeEnHtml(sections: SectionResume[]): string {
  return sections
    .map(
      ({ titre, lignes }) =>
        `<h3>${echapperHtml(titre)}</h3><table>${lignes
          .map(
            ([libelle, valeur]) =>
              `<tr><td style="padding:2px 16px 2px 0;color:#555">${echapperHtml(libelle)}</td><td style="padding:2px 0"><strong>${echapperHtml(valeur)}</strong></td></tr>`
          )
          .join("")}</table>`
    )
    .join("")
}
