"use client"

import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/elements/input"
import { Label } from "@/components/ui/label"
import { companySchema, type Company } from "@/lib/schemas/lead-form"
import { AnimatedField } from "./animated-field"

export function StepCompanyConfirm({
  company,
  onChange,
  onBack,
  onConfirm,
}: {
  company: Company
  onChange: (company: Company) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  // Les champs sont éditables : on revalide avant de laisser passer, en écho de
  // la revalidation faite côté serveur dans `getLeadResult`.
  const handleConfirm = () => {
    const parsed = companySchema.safeParse(company)

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Informations invalides")
      return
    }

    setError(null)
    onConfirm()
  }

  return (
    <div className="space-y-6">
      <AnimatedField index={0}>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold">On vérifie ensemble ?</h2>
          <p className="text-muted-foreground">
            Corrigez les informations si besoin avant de continuer.
          </p>
        </div>
      </AnimatedField>

      <AnimatedField index={1}>
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="raison-sociale">Raison sociale</Label>
              <Input
                id="raison-sociale"
                value={company.nom}
                onChange={(e) => onChange({ ...company, nom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={company.adresse}
                onChange={(e) => onChange({ ...company, adresse: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="siret">SIRET</Label>
                <Input id="siret" value={company.siret} disabled />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="siren">SIREN</Label>
                <Input id="siren" value={company.siren} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedField>

      {error && (
        <AnimatedField index={2}>
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </AnimatedField>
      )}

      <AnimatedField index={3}>
        <div className="flex gap-2">
          <Button type="button" onClick={handleConfirm}>
            Confirmer
          </Button>
          <Button type="button" variant="ghost" onClick={onBack}>
            Retour
          </Button>
        </div>
      </AnimatedField>
    </div>
  )
}
