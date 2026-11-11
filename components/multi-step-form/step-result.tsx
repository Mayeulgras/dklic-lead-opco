"use client"

import { useState } from "react"

import { AmountDisplay } from "@/components/elements/amount-display"
import type { ResultatDemande } from "@/app/actions/lead"
import { AnimatedField } from "@/components/elements/animated-field"
import { ErrorAlert } from "@/components/elements/error-alert"
import { FormActions } from "@/components/elements/form-actions"
import { OpcoBadge } from "@/components/elements/opco-badge"
import { SectionHeader } from "@/components/elements/section-header"
import { Stack } from "@/components/elements/stack"
import { SuccessMessage } from "@/components/elements/success-message"
import { Text } from "@/components/elements/text"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { budgetAnnuel, formaterBudget } from "@/lib/financement/budget"
import { libelleTaille, type Taille } from "@/lib/financement/effectif"
import { libelleOpco, type OpcoId } from "@/lib/financement/opcos"
import { formaterNom } from "@/lib/format"
import type { Company } from "@/lib/schemas/lead-form"

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
  onRappel: () => Promise<ResultatDemande>
}) {
  const [rappel, setRappel] = useState<"attente" | "envoi" | "fait">("attente")
  const [erreur, setErreur] = useState<string | null>(null)
  const budget = budgetAnnuel(opco, taille)

  const demanderRappel = async () => {
    setRappel("envoi")
    setErreur(null)
    const resultat = await onRappel()

    if (resultat.ok) {
      setRappel("fait")
    } else {
      setErreur(resultat.error)
      setRappel("attente")
    }
  }

  // Trois cas, trois façons de l'annoncer. La fourchette (OPCO inconnu) est
  // affichée en taille réduite : elle est deux fois plus longue qu'un montant.
  const montant = formaterBudget(budget)

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

          {erreur && (
            <AnimatedField index={3}>
              <ErrorAlert>{erreur}</ErrorAlert>
            </AnimatedField>
          )}

          <AnimatedField index={4}>
            {rappel === "fait" ? (
              <SuccessMessage>
                C&apos;est noté : un conseiller vous rappelle pour affiner ce budget.
              </SuccessMessage>
            ) : (
              <FormActions>
                <Button
                  type="button"
                  size="lg"
                  loading={rappel === "envoi"}
                  onClick={demanderRappel}
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
