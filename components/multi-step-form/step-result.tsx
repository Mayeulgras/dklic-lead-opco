"use client"

import { useState } from "react"

import { AmountDisplay } from "@/components/elements/amount-display"
import { AnimatedField } from "@/components/elements/animated-field"
import { FormActions } from "@/components/elements/form-actions"
import { OpcoBadge } from "@/components/elements/opco-badge"
import { SectionHeader } from "@/components/elements/section-header"
import { Stack } from "@/components/elements/stack"
import { SuccessMessage } from "@/components/elements/success-message"
import { Text } from "@/components/elements/text"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { budgetAnnuel } from "@/lib/financement/budget"
import { libelleTaille, type Taille } from "@/lib/financement/effectif"
import { libelleOpco, type OpcoId } from "@/lib/financement/opcos"
import { formaterNom } from "@/lib/format"
import type { Company } from "@/lib/schemas/lead-form"

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
  // affichée en taille réduite : elle est deux fois plus longue qu'un montant.
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
    <Card>
      <CardContent>
        <Stack gap="lg">
          <AnimatedField index={0}>
            <SectionHeader
              title="Votre budget formation"
              description={formaterNom(company.nom)}
              aside={opco && <OpcoBadge opco={opco} />}
            />
          </AnimatedField>

          <AnimatedField index={1}>
            <AmountDisplay
              value={montant}
              caption={precision}
              compact={budget.type === "fourchette"}
            />
          </AnimatedField>

          <AnimatedField index={2}>
            <Text size="sub" tone="muted">
              Ordre de grandeur indicatif, sans valeur contractuelle. Le montant exact
              dépend de votre branche et de vos projets de formation.
            </Text>
          </AnimatedField>

          <AnimatedField index={3}>
            {rappelDemande ? (
              <SuccessMessage>
                C&apos;est noté : un conseiller vous rappelle pour affiner ce budget.
              </SuccessMessage>
            ) : (
              <FormActions>
                <Button
                  type="button"
                  size="lg"
                  onClick={() => {
                    setRappelDemande(true)
                    onRappel()
                  }}
                >
                  Être rappelé par un conseiller
                </Button>
              </FormActions>
            )}
          </AnimatedField>
        </Stack>
      </CardContent>
    </Card>
  )
}
