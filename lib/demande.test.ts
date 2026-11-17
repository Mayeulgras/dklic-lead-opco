import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { demandeExemple } from "@/test/demande-exemple"
import { echapperHtml, listeFormations, resumeDemande, resumeEnHtml, resumeEnTexte } from "./demande"

describe("construireDemande", () => {
  it("recalcule l'OPCO et le budget à partir de l'entreprise et de la taille", () => {
    const d = demandeExemple()
    assert.equal(d.opco, "OPCO_EP")
    assert.deepEqual(d.budget, { type: "montant", montant: 4200 })
  })

  it("ignore tout budget venu d'ailleurs : 50 salariés et plus donnent « sur étude »", () => {
    assert.deepEqual(demandeExemple("simulation", { taille: "plus50" }).budget, { type: "surEtude" })
  })
})

describe("resumeDemande", () => {
  const texte = resumeEnTexte(resumeDemande(demandeExemple("rappel")))

  it("contient toutes les coordonnées saisies", () => {
    for (const attendu of [
      "Nom : Jean Dupont",
      "Téléphone : 06 12 34 56 78",
      "Email : jean.dupont@example.com",
      "Raison sociale : BOULANGERIE MARTIN",
      "SIRET : 12345678900012",
      "SIREN : 123456789",
      "Code NAF : 10.71C",
    ]) {
      assert.ok(texte.includes(attendu), `manque « ${attendu} »`)
    }
  })

  it("reprend ce que le simulateur a annoncé", () => {
    assert.ok(texte.includes("OPCO : OPCO EP"))
    assert.ok(texte.includes("Taille indiquée : moins de 11 salariés"))
    assert.match(texte, /Budget annoncé : 4\s200\s€/)
    assert.ok(texte.includes("Rappel demandé : Oui"))
  })

  it("date le consentement à l'heure de Paris", () => {
    assert.match(texte, /Accepté le : 11 novembre 2026 à 15:30/)
  })

  it("signale l'absence d'OPCO et de convention", () => {
    const sansOpco = resumeEnTexte(resumeDemande(demandeExemple("simulation", { company: { idcc: [] } })))
    assert.ok(sansOpco.includes("OPCO : Non identifié"))
    assert.ok(sansOpco.includes("Conventions collectives (IDCC) : Aucune déclarée"))
  })
})

describe("formations cochées", () => {
  const formations = [
    { nom: "Management d'équipes", url: "https://dklic.odoo.com/shop/management-21" },
    { nom: "Cerveau performant", url: "https://dklic.odoo.com/shop/cerveau-19" },
  ]

  it("apparaissent dans le résumé, avec le lien du programme", () => {
    const texte = resumeEnTexte(resumeDemande(demandeExemple("rappel", { formations })))
    assert.ok(texte.includes("FORMATIONS QUI L'INTÉRESSENT"))
    assert.ok(texte.includes("Management d'équipes : https://dklic.odoo.com/shop/management-21"))
  })

  it("n'ajoutent pas de section quand il n'y en a pas", () => {
    assert.ok(!resumeEnTexte(resumeDemande(demandeExemple("rappel"))).includes("FORMATIONS"))
  })

  it("se lisent en une phrase", () => {
    assert.equal(listeFormations(formations), "Management d'équipes et Cerveau performant")
    assert.equal(listeFormations([...formations, { nom: "IA", url: "" }]), "Management d'équipes, Cerveau performant et IA")
    assert.equal(listeFormations(formations.slice(0, 1)), "Management d'équipes")
  })
})

describe("échappement HTML", () => {
  it("neutralise les balises saisies par le visiteur", () => {
    assert.equal(echapperHtml(`<script>"a" & 'b'</script>`), "&lt;script&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/script&gt;")
  })

  it("s'applique au résumé HTML", () => {
    const html = resumeEnHtml(resumeDemande(demandeExemple("simulation", { contact: { nom: "<b>Dupont</b>" } })))
    assert.ok(!html.includes("<b>Dupont</b>"))
    assert.ok(html.includes("&lt;b&gt;Dupont&lt;/b&gt;"))
  })
})
