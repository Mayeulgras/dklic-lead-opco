import assert from "node:assert/strict"
import nodemailer from "nodemailer"
import { describe, it } from "vitest"

import { demandeExemple } from "@/test/demande-exemple"
import { configMail, contenuNotification, envoyerNotification } from "./notification"

const ENV = {
  SMTP_HOST: "smtp.exemple.fr",
  SMTP_USER: "simulateur@dklic.fr",
  SMTP_PASSWORD: "motdepasse",
  MAIL_DESTINATAIRE: "contacts@dklic.fr",
}

describe("configMail", () => {
  it("reste vide tant qu'un réglage obligatoire manque", () => {
    assert.equal(configMail({}), null)
    assert.equal(configMail({ ...ENV, MAIL_DESTINATAIRE: "" }), null)
  })

  it("utilise le port 587 et le compte SMTP comme expéditeur par défaut", () => {
    assert.deepEqual(configMail(ENV), {
      hote: "smtp.exemple.fr",
      port: 587,
      utilisateur: "simulateur@dklic.fr",
      motDePasse: "motdepasse",
      expediteur: "simulateur@dklic.fr",
      destinataire: "contacts@dklic.fr",
    })
  })
})

describe("contenuNotification", () => {
  const lien = "https://dklic.odoo.com/web#id=42&model=crm.lead&view_type=form"

  it("annonce un nouveau contact avec toutes ses coordonnées", () => {
    const { sujet, texte } = contenuNotification(demandeExemple(), { statut: "enregistre", lien, nouvelle: true })
    assert.equal(sujet, "Nouveau contact du simulateur OPCO : BOULANGERIE MARTIN – Jean Dupont")
    for (const attendu of ["Jean Dupont", "06 12 34 56 78", "jean.dupont@example.com", "12345678900012", lien]) {
      assert.ok(texte.includes(attendu), `manque « ${attendu} »`)
    }
  })

  it("distingue la demande de rappel", () => {
    const { sujet, texte } = contenuNotification(demandeExemple("rappel"), { statut: "simule" })
    assert.equal(sujet, "Demande de rappel : BOULANGERIE MARTIN – Jean Dupont")
    assert.ok(texte.startsWith("Ce contact demande à être rappelé"))
  })

  it("alerte quand Odoo n'a pas enregistré la demande", () => {
    const { texte, html } = contenuNotification(demandeExemple(), {
      statut: "echec",
      raison: "Clé API Odoo refusée",
    })
    assert.ok(texte.includes("ATTENTION : la demande n'a pas pu être enregistrée dans Odoo (Clé API Odoo refusée)"))
    assert.ok(texte.includes("saisir ce contact à la main"))
    assert.ok(html.includes("color:#b91c1c"))
  })

  it("échappe les saisies dans la version HTML", () => {
    const { html } = contenuNotification(demandeExemple("simulation", { contact: { prenom: "<img src=x>" } }), {
      statut: "simule",
    })
    assert.ok(!html.includes("<img"))
  })
})

describe("envoyerNotification", () => {
  it("écrit à l'adresse de l'équipe, avec le prospect en « répondre à »", async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true })
    const envois: { message: string }[] = []
    const espion = {
      sendMail: async (options: Parameters<typeof transport.sendMail>[0]) => {
        const info = await transport.sendMail(options)
        envois.push(info as unknown as { message: string })
        return info
      },
    }

    await envoyerNotification(demandeExemple(), { statut: "simule" }, configMail(ENV)!, espion)

    const message = JSON.parse(envois[0].message)
    assert.deepEqual(message.to, [{ address: "contacts@dklic.fr", name: "" }])
    assert.deepEqual(message.from, { address: "simulateur@dklic.fr", name: "" })
    assert.deepEqual(message.replyTo, [{ address: "jean.dupont@example.com", name: "Jean Dupont" }])
    assert.match(message.subject, /^Nouveau contact du simulateur OPCO/)
  })
})
