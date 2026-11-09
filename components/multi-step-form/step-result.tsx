"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { budgetAnnuel } from "@/lib/financement/budget"
import { libelleTaille, type Taille } from "@/lib/financement/effectif"
import { libelleOpco, type OpcoId } from "@/lib/financement/opcos"
import { formaterNom } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Company } from "@/lib/schemas/lead-form"
import { AnimatedField } from "./animated-field"
import { StepCard } from "./step-card"

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

/**
 * Étape 3 : un seul chiffre, comme chez les concurrents. Le détail se dit au
 * téléphone — l'écran ne sert qu'à donner un ordre de grandeur crédible et à
 * déclencher le rappel.
 */
export function StepResult({
  company,
  opco,
  taille,
  onRappel,
}: {
  company: Company
  opco: OpcoId | null
  taille: Taille
  onRappel: () => void
}) {
  const [rappelDemande, setRappelDemande] = useState(false)
  const budget = budgetAnnuel(opco, taille)

  // Trois cas, trois façons de l'annoncer. La fourchette (OPCO inconnu) est
  // écrite plus petit : elle est deux fois plus longue qu'un montant.
  const montant =
    budget.type === "surEtude"
      ? "Sur étude"
      : budget.type === "montant"
        ? euros.format(budget.montant)
        : `${euros.format(budget.min)} – ${euros.format(budget.max)}`

  const precision =
    budget.type === "surEtude"
      ? "Au-delà de 50 salariés, votre OPCO finance vos formations projet par projet."
      : budget.type === "montant"
        ? `par an, pris en charge par ${libelleOpco(opco!)} pour une entreprise de ${libelleTaille(taille)}`
        : `par an selon l'OPCO dont vous dépendez, pour une entreprise de ${libelleTaille(taille)}. Nous ne l'avons pas identifié : aucune convention collective n'est déclarée pour votre entreprise.`

  return (
    <StepCard>
      <div className="space-y-6 sm:space-y-8">
        <AnimatedField index={0}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-heading leading-tight font-semibold">
                Votre budget formation
              </h2>
              <p className="text-muted-foreground">{formaterNom(company.nom)}</p>
            </div>
            {opco && <Badge className="h-7 px-3 text-sm">{libelleOpco(opco)}</Badge>}
          </div>
        </AnimatedField>

        <AnimatedField index={1}>
          <div className="space-y-2 rounded-xl bg-secondary p-6 sm:p-8">
            <p
              className={cn(
                "leading-none font-semibold tracking-tight tabular-nums",
                budget.type === "fourchette"
                  ? "text-2xl sm:text-3xl"
                  : "text-4xl sm:text-5xl"
              )}
            >
              {montant}
            </p>
            <p className="text-muted-foreground">{precision}</p>
          </div>
        </AnimatedField>

        <AnimatedField index={2}>
          <p className="text-sub leading-relaxed text-muted-foreground">
            Ordre de grandeur indicatif, sans valeur contractuelle. Le montant exact
            dépend de votre branche et de vos projets de formation.
          </p>
        </AnimatedField>

        <AnimatedField index={3}>
          {rappelDemande ? (
            <p className="flex items-center gap-2 font-medium text-primary">
              <CheckCircle2 className="size-5 shrink-0" />
              C&apos;est noté : un conseiller vous rappelle pour affiner ce budget.
            </p>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => {
                setRappelDemande(true)
                onRappel()
              }}
            >
              Être rappelé par un conseiller
            </Button>
          )}
        </AnimatedField>
      </div>
    </StepCard>
  )
}
