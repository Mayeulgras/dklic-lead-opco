"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { Input } from "@/components/elements/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formaterNom } from "@/lib/format"
import { searchResponseSchema, type Company } from "@/lib/schemas/lead-form"
import { AnimatedField } from "./animated-field"
import { useDebouncedValue } from "./use-debounced-value"
import { ManualSiretEntry } from "./manual-siret-entry"
import { StepCard } from "./step-card"

export function StepCompanySearch({
  onSelect,
}: {
  onSelect: (company: Company) => void
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 350)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      return
    }

    const controller = new AbortController()

    const runSearch = () => {
      setLoading(true)
      setError(null)

      fetch(`/api/entreprises/search?q=${encodeURIComponent(debouncedQuery)}`, {
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
  }, [debouncedQuery])

  return (
    // `overflow-visible` : la carte coupe par défaut ce qui dépasse, ce qui
    // masquerait la liste d'auto-complétion sous le champ. Le menu porte son
    // propre fond opaque, il reste lisible en dehors de la carte.
    <StepCard className="overflow-visible">
      <div className="space-y-6 sm:space-y-8">
        <AnimatedField index={0}>
          <div className="space-y-3">
            <h1 className="text-heading leading-tight font-semibold">
              Calculez votre budget formation
            </h1>
            <p className="text-muted-foreground">
              Découvrez en 1 minute votre OPCO et le budget formation annuel de
              votre entreprise.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-medium">
              {["Gratuit", "Sans engagement", "Données officielles"].map((atout) => (
                <li key={atout} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" />
                  {atout}
                </li>
              ))}
            </ul>
          </div>
        </AnimatedField>

        {!manualMode ? (
          <AnimatedField index={1}>
            <div ref={containerRef} className="relative space-y-2">
              <Label htmlFor="company-search">Nom de l&apos;entreprise ou SIRET</Label>
              <Input
                id="company-search"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                placeholder="Ex : Boulangerie Martin"
              />

              {open && debouncedQuery.trim().length >= 2 && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl bg-white text-popover-foreground shadow-lg ring-1 ring-foreground/10">
                  {loading && (
                    <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Recherche en cours...
                    </div>
                  )}
                  {!loading && results.length === 0 && (
                    <div className="px-4 py-4 text-sm text-muted-foreground">
                      Aucune entreprise trouvée
                    </div>
                  )}
                  {!loading && results.length > 0 && (
                    <ul className="max-h-80 overflow-y-auto py-1.5">
                      {results.map((company) => (
                        <li key={company.siret}>
                          <button
                            type="button"
                            className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-muted"
                            onClick={() => {
                              setOpen(false)
                              onSelect(company)
                            }}
                          >
                            <span className="font-medium">{formaterNom(company.nom)}</span>
                            {/* L'adresse de l'annuaire contient déjà code postal
                                et ville : ne pas les rajouter. */}
                            <span className="text-sm text-muted-foreground">
                              {formaterNom(company.adresse)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </AnimatedField>
        ) : (
          <ManualSiretEntry
            onSelect={onSelect}
            onCancel={() => setManualMode(false)}
          />
        )}

        {error && (
          <AnimatedField index={2}>
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </AnimatedField>
        )}

        {!manualMode && (
          <AnimatedField index={3}>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="text-left text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Introuvable ? Saisir le SIRET
            </button>
          </AnimatedField>
        )}
      </div>
    </StepCard>
  )
}
