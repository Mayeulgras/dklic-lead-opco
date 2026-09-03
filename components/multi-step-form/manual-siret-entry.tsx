"use client"

import { useState, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/elements/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { searchResponseSchema, type Company } from "@/lib/schemas/lead-form"
import { AnimatedField } from "./animated-field"

export function ManualSiretEntry({
  onSelect,
  onCancel,
}: {
  onSelect: (company: Company) => void
  onCancel: () => void
}) {
  const [siret, setSiret] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const cleaned = siret.replace(/\s/g, "")

    if (cleaned.length !== 14) {
      setError("Le SIRET doit contenir 14 chiffres")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/entreprises/search?q=${cleaned}`)
      const parsed = searchResponseSchema.safeParse(await res.json())

      if (!parsed.success) {
        setError("Réponse inattendue du service de recherche d'entreprises")
        return
      }

      const data = parsed.data

      if (data.error) {
        setError(data.error)
        return
      }

      const match = data.results?.find((c) => c.siret === cleaned) ?? data.results?.[0]

      if (!match) {
        setError("Aucune entreprise trouvée pour ce SIRET")
        return
      }

      onSelect(match)
    } catch {
      setError("Impossible de contacter le service de recherche d'entreprises")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatedField index={1}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="siret">Numéro SIRET</Label>
          <Input
            id="siret"
            inputMode="numeric"
            placeholder="14 chiffres"
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Valider
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Retour à la recherche
          </Button>
        </div>
      </form>
    </AnimatedField>
  )
}
