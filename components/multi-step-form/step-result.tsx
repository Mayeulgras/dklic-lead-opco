"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import type { Formation, OpcoResult } from "@/lib/schemas/lead-form"
import { AnimatedField } from "./animated-field"

export function StepResult({
  opco,
  formations,
  onCta,
}: {
  opco: OpcoResult
  formations: Formation[]
  onCta: (type: "financement" | "dossier") => void
}) {
  const budget = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  })

  return (
    <div className="space-y-6">
      <AnimatedField index={0}>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold">Votre résultat</h2>
          <p className="text-muted-foreground">
            Voici l&apos;OPCO dont vous dépendez et une estimation de votre budget
            formation.
          </p>
        </div>
      </AnimatedField>

      <AnimatedField index={1}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>{opco.nom}</CardTitle>
              <Badge>Votre OPCO</Badge>
            </div>
            <CardDescription>Opérateur de compétences de rattachement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">
                {budget.format(opco.budgetMin)} – {budget.format(opco.budgetMax)}
              </span>
              <Badge variant="secondary">Estimatif</Badge>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  Montant estimatif calculé à partir de règles publiques, à confirmer
                  avec votre OPCO.
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </AnimatedField>

      <AnimatedField index={2}>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Formations qui pourraient vous intéresser
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {formations.map((formation) => (
              <Card key={formation.id} size="sm">
                <CardContent>
                  <p className="font-medium">{formation.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {formation.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedField>

      <AnimatedField index={3}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={() => onCta("financement")}>
            Étude de financement de vos formations
          </Button>
          <Button type="button" variant="outline" onClick={() => onCta("dossier")}>
            Montage de dossier
          </Button>
        </div>
      </AnimatedField>
    </div>
  )
}
