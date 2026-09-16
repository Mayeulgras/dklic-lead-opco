import type { Formation } from "@/lib/schemas/lead-form"

/**
 * Catalogue de formations de démonstration.
 *
 * TODO: remplacer par une requête au catalogue Odoo filtrée sur le code NAF de
 * l'entreprise (spec §6.4). Bloqué sur les accès API Odoo.
 *
 * Le calcul de budget qui vivait ici a été remplacé par le moteur réel de
 * `lib/financement/` — ne pas réintroduire de montant simulé.
 */
export const FORMATIONS_DEMO: Formation[] = [
  {
    id: "1",
    nom: "Management d'équipe",
    description: "Piloter et fédérer une équipe au quotidien.",
  },
  {
    id: "2",
    nom: "Excel avancé",
    description: "Maîtriser les fonctions avancées et TCD.",
  },
  {
    id: "3",
    nom: "Prévention des risques professionnels",
    description: "Sensibilisation et obligations réglementaires.",
  },
]
