import "server-only"

import nodemailer, { type Transporter } from "nodemailer"

import {
  echapperHtml,
  nomComplet,
  resumeDemande,
  resumeEnHtml,
  resumeEnTexte,
  type Demande,
} from "../demande"

/**
 * Mail envoyé à l'équipe dklic pour chaque demande, avec toutes les
 * coordonnées. Il part par SMTP, que proposent toutes les messageries (Google,
 * Microsoft, OVH, Brevo…) : changer de fournisseur ne demande que de changer
 * les variables d'environnement.
 *
 * Il sert aussi de filet de sécurité : si Odoo a refusé la demande, le mail le
 * dit, pour que le contact soit saisi à la main.
 */

export interface ConfigMail {
  hote: string
  port: number
  utilisateur: string
  motDePasse: string
  expediteur: string
  destinataire: string
}

export function configMail(env: Record<string, string | undefined> = process.env): ConfigMail | null {
  const hote = env.SMTP_HOST?.trim()
  const utilisateur = env.SMTP_USER?.trim()
  const motDePasse = env.SMTP_PASSWORD
  const destinataire = env.MAIL_DESTINATAIRE?.trim()
  if (!hote || !utilisateur || !motDePasse || !destinataire) return null

  return {
    hote,
    port: Number(env.SMTP_PORT) || 587,
    utilisateur,
    motDePasse,
    expediteur: env.MAIL_EXPEDITEUR?.trim() || utilisateur,
    destinataire,
  }
}

/** Ce que le mail dit d'Odoo. */
export type EtatOdoo =
  | { statut: "enregistre"; lien: string; nouvelle: boolean }
  | { statut: "echec"; raison: string }
  | { statut: "simule" }

function phraseOdoo(etat: EtatOdoo): { texte: string; alerte: boolean } {
  switch (etat.statut) {
    case "enregistre":
      return {
        texte: `${etat.nouvelle ? "Opportunité créée" : "Opportunité existante mise à jour"} dans Odoo : ${etat.lien}`,
        alerte: false,
      }
    case "echec":
      return {
        texte: `ATTENTION : la demande n'a pas pu être enregistrée dans Odoo (${etat.raison}). Merci de saisir ce contact à la main.`,
        alerte: true,
      }
    case "simule":
      return { texte: "Mode simulation : Odoo n'est pas branché.", alerte: false }
  }
}

export function contenuNotification(d: Demande, etatOdoo: EtatOdoo) {
  const qui = `${d.company.nom} – ${nomComplet(d.contact)}`
  const sujet =
    d.type === "rappel" ? `Demande de rappel : ${qui}` : `Nouveau contact du simulateur OPCO : ${qui}`
  const intro =
    d.type === "rappel"
      ? "Ce contact demande à être rappelé par un conseiller."
      : "Un visiteur a laissé ses coordonnées sur le simulateur de budget formation."

  const odoo = phraseOdoo(etatOdoo)
  const sections = resumeDemande(d)

  const texte = [intro, odoo.texte, resumeEnTexte(sections)].join("\n\n")

  const lienOdoo =
    etatOdoo.statut === "enregistre"
      ? `<a href="${echapperHtml(etatOdoo.lien)}">${etatOdoo.nouvelle ? "Opportunité créée" : "Opportunité mise à jour"} dans Odoo</a>`
      : echapperHtml(odoo.texte)

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#000">
<p>${echapperHtml(intro)}</p>
<p${odoo.alerte ? ' style="color:#b91c1c;font-weight:bold"' : ""}>${lienOdoo}</p>
${resumeEnHtml(sections)}
</div>`

  return { sujet, texte, html }
}

export async function envoyerNotification(
  d: Demande,
  etatOdoo: EtatOdoo,
  config: ConfigMail,
  transport: Pick<Transporter, "sendMail"> = transportMail(config)
) {
  const { sujet, texte, html } = contenuNotification(d, etatOdoo)

  await transport.sendMail({
    from: config.expediteur,
    to: config.destinataire,
    // « Répondre » écrit directement au prospect.
    replyTo: { name: nomComplet(d.contact), address: d.contact.email },
    subject: sujet,
    text: texte,
    html,
  })
}

export function transportMail(config: ConfigMail) {
  return nodemailer.createTransport({
    host: config.hote,
    port: config.port,
    // 465 : connexion chiffrée d'emblée. 587 : chiffrement négocié (STARTTLS).
    secure: config.port === 465,
    auth: { user: config.utilisateur, pass: config.motDePasse },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
}
