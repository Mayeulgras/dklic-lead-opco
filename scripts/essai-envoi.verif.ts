/**
 * Essai réel de bout en bout : crée une société, un contact et une opportunité
 * de TEST dans Odoo, puis envoie les deux mails (simulation et rappel) à
 * l'adresse de l'équipe. À lancer après `npm run verifier` :
 *
 *   npm run essai-envoi
 *
 * Les fiches créées portent « TEST SIMULATEUR » dans leur nom : à supprimer
 * dans Odoo une fois vérifiées. Relancer l'essai réutilise les mêmes fiches.
 */
import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { construireDemande } from "@/lib/demande"
import { canauxDepuisEnvironnement, enregistrerDemande } from "@/lib/enregistrement"

try {
  process.loadEnvFile(".env.local")
} catch {
  // Pas de fichier : les variables viennent déjà de l'environnement.
}

const SOCIETE_TEST = {
  siren: "000000000",
  siret: "00000000000000",
  nom: "TEST SIMULATEUR DKLIC - A SUPPRIMER",
  adresse: "1 RUE DE TEST 75001 PARIS",
  codePostal: "75001",
  ville: "PARIS",
  codeNaf: "85.59A",
  effectif: "01",
  idcc: ["3253"],
}

const CONTACT_TEST = {
  prenom: "Test",
  nom: "Simulateur",
  telephone: "06 00 00 00 00",
  email: "test.simulateur@example.com",
  consentRgpd: true,
}

describe("Essai réel", () => {
  for (const type of ["simulation", "rappel"] as const) {
    it(`demande « ${type} » enregistrée dans Odoo et envoyée par mail`, async () => {
      const demande = construireDemande(type, SOCIETE_TEST, CONTACT_TEST, "moins11")
      const resultat = await enregistrerDemande(demande, canauxDepuisEnvironnement(), { simulation: false })

      if (resultat.odoo.statut === "enregistre") console.log(`  Odoo : ${resultat.odoo.lien}`)
      console.log(`  mail : ${resultat.mail}`)

      assert.equal(resultat.odoo.statut, "enregistre", JSON.stringify(resultat.odoo))
      assert.equal(resultat.mail, "envoye")
    })
  }
})
