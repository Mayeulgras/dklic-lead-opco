import type { Company, Formation, OpcoResult } from "@/lib/schemas/lead-form"

// TODO: remplacer par l'appel réel à l'API CFADock / table de correspondance
// NAF -> IDCC -> OPCO (spec section 7.2) et par le calcul de budget (section 7.3).
// Génère un résultat plausible à partir du code NAF pour permettre de développer
// et d'itérer sur le design de l'étape 4 en attendant ces intégrations.
const OPCOS = [
  "AKTO",
  "OPCO Atlas",
  "OPCO EP",
  "OPCO Mobilités",
  "OPCO Santé",
  "OPCO 2i",
]

export function getMockResult(company: Company): {
  opco: OpcoResult
  formations: Formation[]
} {
  const seed = Array.from(company.codeNaf).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const opcoName = OPCOS[seed % OPCOS.length]
  const base = 1000 + (seed % 5) * 500

  return {
    opco: {
      nom: opcoName,
      budgetMin: base,
      budgetMax: base * 2.5,
    },
    formations: [
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
    ],
  }
}
