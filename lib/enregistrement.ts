import "server-only"

import { resumeDemande, resumeEnTexte, type Demande } from "./demande"
import { configMail, envoyerNotification, type EtatOdoo } from "./mail/notification"
import { clientOdoo, configOdoo } from "./odoo/client"
import { enregistrerDansOdoo, lienOpportunite } from "./odoo/prospect"

/**
 * Enregistre une demande par deux canaux : Odoo, puis le mail à l'équipe. La
 * demande est sauvée dès qu'un des deux a réussi : si Odoo est en panne ou si
 * sa clé a expiré, le mail suffit (et le signale).
 *
 * Un canal sans configuration est « simulé » en développement (son contenu
 * part dans le terminal) mais compte comme un échec en production : on ne
 * laisse jamais croire au visiteur qu'une demande perdue a été enregistrée.
 */

export interface Canaux {
  /** `null` : Odoo n'est pas configuré. */
  odoo: ((d: Demande) => Promise<{ opportuniteId: number; nouvelle: boolean; lien: string }>) | null
  /** `null` : le mail n'est pas configuré. */
  mail: ((d: Demande, etatOdoo: EtatOdoo) => Promise<void>) | null
}

export interface ResultatEnregistrement {
  ok: boolean
  odoo: EtatOdoo
  mail: "envoye" | "simule" | "echec"
}

export async function enregistrerDemande(
  d: Demande,
  canaux: Canaux,
  { simulation }: { simulation: boolean }
): Promise<ResultatEnregistrement> {
  let odoo: EtatOdoo

  if (!canaux.odoo) {
    odoo = simulation ? { statut: "simule" } : { statut: "echec", raison: "Odoo n'est pas configuré" }
  } else {
    try {
      const { lien, nouvelle } = await canaux.odoo(d)
      odoo = { statut: "enregistre", lien, nouvelle }
    } catch (erreur) {
      console.error("Enregistrement Odoo impossible :", erreur)
      odoo = { statut: "echec", raison: erreur instanceof Error ? erreur.message : String(erreur) }
    }
  }

  let mail: ResultatEnregistrement["mail"]

  if (!canaux.mail) {
    if (simulation) {
      mail = "simule"
    } else {
      console.error("Mail de notification non envoyé : la configuration SMTP est absente")
      mail = "echec"
    }
  } else {
    try {
      await canaux.mail(d, odoo)
      mail = "envoye"
    } catch (erreur) {
      console.error("Mail de notification impossible :", erreur)
      mail = "echec"
    }
  }

  if (odoo.statut === "simule" || mail === "simule") {
    console.info(
      `[simulation] Demande « ${d.type} » (Odoo : ${odoo.statut}, mail : ${mail})\n${resumeEnTexte(resumeDemande(d))}`
    )
  }

  const odooOk = odoo.statut !== "echec"
  const mailOk = mail !== "echec"

  if (!odooOk && !mailOk) {
    console.error("Demande perdue : ni Odoo ni le mail n'ont fonctionné", resumeEnTexte(resumeDemande(d)))
  }

  return { ok: odooOk || mailOk, odoo, mail }
}

/** Les canaux réels, construits à partir des variables d'environnement. */
export function canauxDepuisEnvironnement(): Canaux {
  const odoo = configOdoo()
  const mail = configMail()

  return {
    odoo: odoo
      ? async (d) => {
          const resultat = await enregistrerDansOdoo(d, clientOdoo(odoo), {
            commercialId: odoo.commercialId,
          })
          return { ...resultat, lien: lienOpportunite(odoo.url, resultat.opportuniteId) }
        }
      : null,
    mail: mail ? (d, etat) => envoyerNotification(d, etat, mail) : null,
  }
}
