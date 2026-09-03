"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/elements/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { searchResponseSchema, type Company } from "@/lib/schemas/lead-form"
import { AnimatedField } from "./animated-field"
import { useDebouncedValue } from "./use-debounced-value"
import { ManualSiretEntry } from "./manual-siret-entry"

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
    <div className="space-y-6">
      <AnimatedField index={0}>
        <div className="space-y-1.5">
          <h2 className="text-heading font-semibold">Quelle est votre entreprise ?</h2>
          <p className="text-muted-foreground text-base">
            Recherchez votre entreprise par son nom pour démarrer.
          </p>
        </div>
      </AnimatedField>

      {!manualMode ? (
        <AnimatedField index={1}>
          <div ref={containerRef} className="relative space-y-1.5">
            <Label htmlFor="company-search" className="text-base">
              Nom de l&apos;entreprise
            </Label>
            <Input
              id="company-search"
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder="Ex: Danone, Decathlon..."
            />

            {open && debouncedQuery.trim().length >= 2 && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10">
                {loading && (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Recherche en cours...
                  </div>
                )}
                {!loading && results.length === 0 && (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    Aucune entreprise trouvée
                  </div>
                )}
                {!loading && results.length > 0 && (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {results.map((company) => (
                      <li key={company.siret}>
                        <button
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => {
                            setOpen(false)
                            onSelect(company)
                          }}
                        >
                          <span className="font-medium">{company.nom}</span>
                          <span className="text-xs text-muted-foreground">
                            {company.adresse}, {company.codePostal} {company.ville}
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
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Mon entreprise n&apos;apparaît pas, saisir le SIRET manuellement
          </button>
        </AnimatedField>
      )}
    </div>
  )
}
