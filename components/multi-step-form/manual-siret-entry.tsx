"use client"

import { useState, type FormEvent } from "react"

import { AnimatedField } from "@/components/elements/animated-field"
import { ErrorAlert } from "@/components/elements/error-alert"
import { FormActions } from "@/components/elements/form-actions"
import { FormField } from "@/components/elements/form-field"
import { Stack } from "@/components/elements/stack"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchResponseSchema, type Company } from "@/lib/schemas/lead-form"

export function ManualSiretEntry({
  onSelect,
  onCancel,
}: {
  onSelect: (company: Company) => void
  onCancel: () => void
}) {
  const [siret, setSiret] = useState("")
  const [loading, setLoading] = useState(false)
  // Ce qui concerne la saisie s'affiche sous le champ ; une panne du service,
  // dans le bloc d'erreur.
  const [erreurChamp, setErreurChamp] = useState<string | null>(null)
  const [erreurService, setErreurService] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const cleaned = siret.replace(/\s/g, "")
    setErreurService(null)

    if (cleaned.length !== 14) {
      setErreurChamp("Le SIRET doit contenir 14 chiffres")
      return
    }

    setLoading(true)
    setErreurChamp(null)

    try {
      const res = await fetch(`/api/entreprises/search?q=${cleaned}`)
      const parsed = searchResponseSchema.safeParse(await res.json())

      if (!parsed.success) {
        setErreurService("Réponse inattendue du service de recherche d'entreprises")
        return
      }

      const data = parsed.data

      if (data.error) {
        setErreurService(data.error)
        return
      }

      const match = data.results?.find((c) => c.siret === cleaned) ?? data.results?.[0]

      if (!match) {
        setErreurChamp("Aucune entreprise trouvée pour ce SIRET")
        return
      }

      onSelect(match)
    } catch {
      setErreurService("Impossible de contacter le service de recherche d'entreprises")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedField index={1}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          <FormField label="Numéro SIRET" error={erreurChamp ?? undefined}>
            <Input
              id="siret"
              inputMode="numeric"
              placeholder="14 chiffres"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
            />
          </FormField>

          {erreurService && <ErrorAlert>{erreurService}</ErrorAlert>}

          <FormActions>
            <Button type="submit" loading={loading}>
              Valider
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Retour à la recherche
            </Button>
          </FormActions>
        </Stack>
      </form>
    </AnimatedField>
  )
}
