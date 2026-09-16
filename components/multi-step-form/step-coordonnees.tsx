"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/elements/input"
import { Label } from "@/components/ui/label"
import { PRIVACY_POLICY_URL } from "@/lib/config"
import { TAILLES, type Taille } from "@/lib/financement/effectif"
import { libelleOpco, type OpcoId } from "@/lib/financement/opcos"
import { formaterNom } from "@/lib/format"
import { contactSchema, type Company, type ContactInfo } from "@/lib/schemas/lead-form"
import { cn } from "@/lib/utils"
import { AnimatedField } from "./animated-field"
import { StepCard } from "./step-card"

/**
 * Étape 2, sur le modèle des simulateurs concurrents : on montre d'abord ce
 * qu'on a trouvé (l'OPCO, la taille) pour prouver que l'outil sait, puis on
 * demande les coordonnées pour révéler le montant.
 */
export function StepCoordonnees({
  company,
  opco,
  taille,
  onTailleChange,
  defaultValues,
  loading,
  error,
  onBack,
  onSubmit,
}: {
  company: Company
  opco: OpcoId | null
  taille: Taille | null
  onTailleChange: (taille: Taille) => void
  defaultValues: Partial<ContactInfo>
  loading: boolean
  error: string | null
  onBack: () => void
  onSubmit: (data: ContactInfo) => void
}) {
  const [tailleManquante, setTailleManquante] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactInfo>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      prenom: defaultValues.prenom ?? "",
      nom: defaultValues.nom ?? "",
      telephone: defaultValues.telephone ?? "",
      email: defaultValues.email ?? "",
      consentRgpd: defaultValues.consentRgpd ?? false,
    },
  })

  const consentRgpd = watch("consentRgpd")

  const envoyer = (data: ContactInfo) => {
    // La taille pilote le montant : sans elle, pas de budget à afficher.
    if (!taille) {
      setTailleManquante(true)
      return
    }
    onSubmit(data)
  }

  return (
    <StepCard>
      <form onSubmit={handleSubmit(envoyer)} className="space-y-6 sm:space-y-8">
        <AnimatedField index={0}>
          <h2 className="text-heading leading-tight font-semibold">
            Nous avons trouvé votre entreprise
          </h2>
        </AnimatedField>

        <AnimatedField index={1}>
          <div className="space-y-5 rounded-xl bg-secondary p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-title leading-snug font-semibold">
                  {formaterNom(company.nom)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formaterNom(company.ville)}
                </p>
              </div>
              {opco ? (
                <Badge className="h-7 px-3 text-sm">{libelleOpco(opco)}</Badge>
              ) : (
                <Badge variant="outline" className="h-7 bg-white px-3 text-sm">
                  OPCO non identifié
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nombre de salariés</Label>
              <div className="flex gap-2">
                {TAILLES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onTailleChange(t.id)
                      setTailleManquante(false)
                    }}
                    aria-pressed={taille === t.id}
                    className={cn(
                      "h-10 flex-1 rounded-lg border px-2 text-base font-medium whitespace-nowrap transition-colors",
                      taille === t.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-white hover:border-primary/40"
                    )}
                  >
                    {t.court}
                  </button>
                ))}
              </div>
              {tailleManquante && (
                <p className="text-sm text-destructive">
                  Indiquez la taille de votre entreprise
                </p>
              )}
            </div>
          </div>
        </AnimatedField>

        <AnimatedField index={2}>
          <div className="space-y-4">
            <h3 className="text-title font-semibold">Recevez votre budget formation</h3>
            <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
              <Champ id="prenom" label="Prénom" erreur={errors.prenom?.message}>
                <Input
                  id="prenom"
                  autoComplete="given-name"
                  aria-invalid={!!errors.prenom}
                  {...register("prenom")}
                />
              </Champ>
              <Champ id="nom" label="Nom" erreur={errors.nom?.message}>
                <Input
                  id="nom"
                  autoComplete="family-name"
                  aria-invalid={!!errors.nom}
                  {...register("nom")}
                />
              </Champ>
              <Champ id="telephone" label="Téléphone" erreur={errors.telephone?.message}>
                <Input
                  id="telephone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.telephone}
                  {...register("telephone")}
                />
              </Champ>
              <Champ id="email" label="Email" erreur={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </Champ>
            </div>
          </div>
        </AnimatedField>

        <AnimatedField index={3}>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                className="mt-0.5"
                checked={consentRgpd}
                onCheckedChange={(checked) => setValue("consentRgpd", checked === true)}
              />
              {/* `block` : le Label de base est en flex, ce qui éclaterait le
                  texte et le lien en colonnes séparées. */}
              <Label
                htmlFor="consent"
                className="block leading-relaxed font-normal text-muted-foreground"
              >
                J&apos;accepte d&apos;être recontacté(e) au sujet de mon projet de
                formation, conformément à la{" "}
                {PRIVACY_POLICY_URL ? (
                  // Nouvel onglet : la progression du formulaire vit dans le state
                  // client, une navigation sortante la perdrait entièrement.
                  <a
                    href={PRIVACY_POLICY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline underline-offset-4"
                  >
                    politique de confidentialité
                  </a>
                ) : (
                  "politique de confidentialité"
                )}
                .
              </Label>
            </div>
            {errors.consentRgpd && (
              <p className="text-sm text-destructive">{errors.consentRgpd.message}</p>
            )}
          </div>
        </AnimatedField>

        {error && (
          <AnimatedField index={4}>
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </AnimatedField>
        )}

        <AnimatedField index={5}>
          {/* Mobile : bouton principal pleine largeur, le retour en dessous. */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="lg" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Voir mon budget
            </Button>
            <Button type="button" size="lg" variant="ghost" onClick={onBack}>
              Retour
            </Button>
          </div>
        </AnimatedField>
      </form>
    </StepCard>
  )
}

function Champ({
  id,
  label,
  erreur,
  children,
}: {
  id: string
  label: string
  erreur?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erreur && <p className="text-sm text-destructive">{erreur}</p>}
    </div>
  )
}
