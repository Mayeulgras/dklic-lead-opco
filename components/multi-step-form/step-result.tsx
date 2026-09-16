"use client"

import { useMemo, useState } from "react"
import { Info, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/elements/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DUREES_JOURS, baremeReleve } from "@/lib/financement/baremes"
import {
  analyserEntreprise,
  contexteDepuisEffectif,
  estimer,
} from "@/lib/financement/calcul"
import { libelleOpco, type OpcoId } from "@/lib/financement/opcos"
import type { Company, Formation } from "@/lib/schemas/lead-form"
import { cn } from "@/lib/utils"
import { AnimatedField } from "./animated-field"

const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

export function StepResult({
  company,
  opco,
  formations,
  onCta,
}: {
  company: Company
  opco: OpcoId | null
  formations: Formation[]
  onCta: (type: "financement" | "dossier") => void
}) {
  const contexteApi = useMemo(
    () => analyserEntreprise(company.effectif),
    [company.effectif]
  )

  // Quand l'API ne donne pas l'effectif (`NN`, très fréquent), on le demande :
  // c'est la variable que le client veut au centre de l'outil, et la saisie
  // enrichit le lead au passage.
  const [effectifSaisi, setEffectifSaisi] = useState<string>("")

  const contexte = useMemo(() => {
    const n = Number.parseInt(effectifSaisi, 10)
    return Number.isFinite(n) && n > 0 ? contexteDepuisEffectif(n) : contexteApi
  }, [effectifSaisi, contexteApi])

  const [jours, setJours] = useState<number>(3)
  const [apprenants, setApprenants] = useState<number>(contexte.apprenantsMax)

  // L'effectif peut rétrécir le groupe sous la valeur courante du curseur.
  const apprenantsEffectifs = Math.min(
    Math.max(apprenants, contexte.apprenantsMin),
    contexte.apprenantsMax
  )

  const estimation = useMemo(
    () => estimer({ jours, apprenants: apprenantsEffectifs }, opco),
    [jours, apprenantsEffectifs, opco]
  )

  const groupeFige = contexte.apprenantsMin === contexte.apprenantsMax

  // On garde la distinction relevé/estimé — elle ne coûte rien et évite de
  // présenter un chiffre supposé avec l'aplomb d'un tarif officiel — mais en
  // une phrase, pas en trois paragraphes.
  const ligneMethode = !opco
    ? "Estimation basée sur un forfait horaire moyen du secteur."
    : baremeReleve(opco)
      ? `Basé sur la grille de ${libelleOpco(opco)} : ${estimation.bareme.forfaitHoraire.toLocaleString("fr-FR")} €/heure et par personne.`
      : `Estimation aux conditions habituelles du secteur, à confirmer avec ${libelleOpco(opco)}.`

  return (
    // Fond opaque : le nuage de points dérive en permanence derrière la page, et
    // du texte posé dessus se lit mal. L'étape 4 est la plus dense des quatre,
    // c'est celle où ça se voyait le plus.
    <Card className="bg-white">
      <CardContent className="space-y-6">
        <AnimatedField index={0}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-heading font-semibold">
              Votre financement formation
            </h2>
            {opco && <Badge>{libelleOpco(opco)}</Badge>}
          </div>
        </AnimatedField>

        {/* Une seule carte : le montant, puis — sous un filet — les deux réglages
            qui le font bouger. Regrouper la cause et l'effet évite au visiteur de
            chercher le lien entre les curseurs et le chiffre. */}
        <AnimatedField index={1}>
          <Card className="bg-secondary">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-4xl font-semibold tabular-nums">
                    {euros.format(estimation.montant)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    estimation de prise en charge
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="size-4" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-72">
                        Estimation calculée à partir des règles publiques de votre
                        OPCO. Ce n&apos;est pas un solde de compte : le financement
                        s&apos;obtient formation par formation, sur dossier.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                </div>

                {estimation.bonusAccompagnement !== null && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                    <TrendingUp className="size-4 shrink-0" />+{" "}
                    {euros.format(estimation.bonusAccompagnement)} avec un dossier
                    accompagné
                  </p>
                )}
              </div>

              <Separator className="bg-foreground/10" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Durée</Label>
                  <div className="flex gap-2">
                    {DUREES_JOURS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setJours(n)}
                        aria-pressed={jours === n}
                        className={cn(
                          "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                          jours === n
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-white hover:bg-muted"
                        )}
                      >
                        {n} jour{n > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="apprenants">Personnes à former</Label>
                    <span className="text-sm font-medium tabular-nums">
                      {apprenantsEffectifs}
                    </span>
                  </div>
                  {groupeFige ? (
                    <p className="text-sm text-muted-foreground">
                      Votre effectif permet d&apos;en former{" "}
                      {contexte.apprenantsMax}.
                    </p>
                  ) : (
                    <Slider
                      id="apprenants"
                      min={contexte.apprenantsMin}
                      max={contexte.apprenantsMax}
                      step={1}
                      value={[apprenantsEffectifs]}
                      onValueChange={(v) =>
                        setApprenants(Array.isArray(v) ? v[0] : v)
                      }
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedField>

        {/* La condition porte sur ce que dit l'API, jamais sur `contexte` : celui-ci
            cesse d'être « inconnu » dès la première frappe, ce qui démonterait le
            champ en cours de saisie. */}
        {contexteApi.effectifInconnu && (
          <AnimatedField index={2}>
            <div className="space-y-1.5">
              <Label htmlFor="effectif">
                Combien de salariés compte votre entreprise ?
              </Label>
              <Input
                id="effectif"
                inputMode="numeric"
                placeholder="Ex : 12"
                value={effectifSaisi}
                onChange={(e) =>
                  setEffectifSaisi(e.target.value.replace(/\D/g, ""))
                }
                className="max-w-40"
              />
              <p className="text-sm text-muted-foreground">
                L&apos;effectif n&apos;est pas public pour votre entreprise. Il
                affine l&apos;estimation.
              </p>
            </div>
          </AnimatedField>
        )}

        {/* Note de méthode : utile pour la crédibilité, jamais au premier plan.
            Le détail se dit au téléphone, pas à l'écran. */}
        <AnimatedField index={3}>
          <p className="text-sub text-muted-foreground">{ligneMethode}</p>
        </AnimatedField>

        <AnimatedField index={4}>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Formations adaptées</h3>
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

        <AnimatedField index={5}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => onCta("financement")}>
              Étude de financement de vos formations
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCta("dossier")}
            >
              Montage de dossier
            </Button>
          </div>
        </AnimatedField>
      </CardContent>
    </Card>
  )
}
