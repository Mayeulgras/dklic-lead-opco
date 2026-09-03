"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/elements/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PRIVACY_POLICY_URL } from "@/lib/config"
import { contactSchema, type ContactInfo } from "@/lib/schemas/lead-form"
import { AnimatedField } from "./animated-field"

export function StepContact({
  defaultValues,
  loading,
  error,
  onBack,
  onSubmit,
}: {
  defaultValues: Partial<ContactInfo>
  loading: boolean
  error: string | null
  onBack: () => void
  onSubmit: (data: ContactInfo) => void
}) {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <AnimatedField index={0}>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold">Vos coordonnées</h2>
          <p className="text-muted-foreground">
            Pour vous transmettre le résultat et vous recontacter.
          </p>
        </div>
      </AnimatedField>

      <AnimatedField index={1}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prenom">Prénom</Label>
            <Input id="prenom" aria-invalid={!!errors.prenom} {...register("prenom")} />
            {errors.prenom && (
              <p className="text-xs text-destructive">{errors.prenom.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" aria-invalid={!!errors.nom} {...register("nom")} />
            {errors.nom && (
              <p className="text-xs text-destructive">{errors.nom.message}</p>
            )}
          </div>
        </div>
      </AnimatedField>

      <AnimatedField index={2}>
        <div className="space-y-1.5">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            type="tel"
            aria-invalid={!!errors.telephone}
            {...register("telephone")}
          />
          {errors.telephone && (
            <p className="text-xs text-destructive">{errors.telephone.message}</p>
          )}
        </div>
      </AnimatedField>

      <AnimatedField index={3}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </AnimatedField>

      <AnimatedField index={4}>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <Checkbox
              id="consent"
              checked={consentRgpd}
              onCheckedChange={(checked) => setValue("consentRgpd", checked === true)}
            />
            <Label htmlFor="consent" className="font-normal">
              J&apos;accepte que mes données soient utilisées pour être recontacté(e)
              au sujet de mon projet de formation, conformément à la{" "}
              {PRIVACY_POLICY_URL ? (
                // Nouvel onglet : la progression du formulaire vit dans le state
                // client, une navigation sortante la perdrait entièrement.
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
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
            <p className="text-xs text-destructive">{errors.consentRgpd.message}</p>
          )}
        </div>
      </AnimatedField>

      {error && (
        <AnimatedField index={5}>
          <Alert variant="destructive">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </AnimatedField>
      )}

      <AnimatedField index={6}>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Voir mon résultat
          </Button>
          <Button type="button" variant="ghost" onClick={onBack}>
            Retour
          </Button>
        </div>
      </AnimatedField>
    </form>
  )
}
