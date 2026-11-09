"use client"

import { useEffect, useState } from "react"

import { AnimatedField } from "@/components/elements/animated-field"
import { CheckList } from "@/components/elements/check-list"
import { ErrorAlert } from "@/components/elements/error-alert"
import { SearchCombobox } from "@/components/elements/search-combobox"
import { SectionHeader } from "@/components/elements/section-header"
import { Stack } from "@/components/elements/stack"
import { Text } from "@/components/elements/text"
import { TextLink } from "@/components/elements/text-link"
import { Card, CardContent } from "@/components/ui/card"
import { formaterNom } from "@/lib/format"
import { searchResponseSchema, type Company } from "@/lib/schemas/lead-form"
import { ManualSiretEntry } from "./manual-siret-entry"

const RECHERCHE_MIN = 2
const ATOUTS = ["Gratuit", "Sans engagement", "Données officielles"]

export function StepCompanySearch({
  onSelect,
}: {
  onSelect: (company: Company) => void
}) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)

  useEffect(() => {
    if (search.length < RECHERCHE_MIN) {
      return
    }

    const controller = new AbortController()

    const runSearch = () => {
      setLoading(true)
      setError(null)

      fetch(`/api/entreprises/search?q=${encodeURIComponent(search)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((payload: unknown) => {
          const parsed = searchResponseSchema.safeParse(payload)

          if (!parsed.success) {
            setError("Réponse inattendue du service de recherche d'entreprises")
            setResults([])
            return
          }

          if (parsed.data.error) {
            setError(parsed.data.error)
            setResults([])
          } else {
            setResults(parsed.data.results ?? [])
          }
        })
        .catch((err: Error) => {
          if (err.name !== "AbortError") {
            setError("Impossible de contacter le service de recherche d'entreprises")
          }
        })
        .finally(() => setLoading(false))
    }

    runSearch()

    return () => controller.abort()
  }, [search])

  return (
    <Card>
      <CardContent>
        <Stack gap="lg">
          <AnimatedField index={0}>
            <Stack gap="sm">
              <SectionHeader
                as="h1"
                title="Calculez votre budget formation"
                description="Découvrez en 1 minute votre OPCO et le budget formation annuel de votre entreprise."
              />
              <CheckList items={ATOUTS} />
            </Stack>
          </AnimatedField>

          {!manualMode ? (
            <AnimatedField index={1}>
              <SearchCombobox
                id="company-search"
                label="Nom de l'entreprise ou SIRET"
                placeholder="Ex : Boulangerie Martin"
                items={results}
                loading={loading}
                minChars={RECHERCHE_MIN}
                onSearch={setSearch}
                onSelect={onSelect}
                itemKey={(company) => company.siret}
                itemLabel={(company) => formaterNom(company.nom)}
                emptyMessage="Aucune entreprise trouvée"
                renderItem={(company) => (
                  <>
                    <Text as="span" weight="medium">
                      {formaterNom(company.nom)}
                    </Text>
                    {/* L'adresse de l'annuaire contient déjà code postal et
                        ville : ne pas les rajouter. */}
                    <Text as="span" size="small" tone="muted">
                      {formaterNom(company.adresse)}
                    </Text>
                  </>
                )}
              />
            </AnimatedField>
          ) : (
            <ManualSiretEntry onSelect={onSelect} onCancel={() => setManualMode(false)} />
          )}

          {error && (
            <AnimatedField index={2}>
              <ErrorAlert>{error}</ErrorAlert>
            </AnimatedField>
          )}

          {!manualMode && (
            <AnimatedField index={3}>
              <TextLink onClick={() => setManualMode(true)}>
                Introuvable ? Saisir le SIRET
              </TextLink>
            </AnimatedField>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
