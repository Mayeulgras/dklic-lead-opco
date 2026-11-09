"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { AnimatedField } from "@/components/elements/animated-field"
import { CheckboxField } from "@/components/elements/checkbox-field"
import { ErrorAlert } from "@/components/elements/error-alert"
import { FormActions } from "@/components/elements/form-actions"
import { FieldGrid, FormField } from "@/components/elements/form-field"
import { Heading } from "@/components/elements/heading"
import { OpcoBadge } from "@/components/elements/opco-badge"
import { Panel } from "@/components/elements/panel"
import { SectionHeader } from "@/components/elements/section-header"
import { SegmentedControl } from "@/components/elements/segmented-control"
import { Stack } from "@/components/elements/stack"
import { TextLink } from "@/components/elements/text-link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PRIVACY_POLICY_URL } from "@/lib/config"
import { TAILLES, type Taille } from "@/lib/financement/effectif"
import type { OpcoId } from "@/lib/financement/opcos"
import { formaterNom } from "@/lib/format"
import { contactSchema, type Company, type ContactInfo } from "@/lib/schemas/lead-form"

// Libellés courts : ils tiennent sur une ligne dans trois boutons en 390 px.
const OPTIONS_TAILLE = TAILLES.map((t) => ({ value: t.id, label: t.court }))

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
    <Card>
      <CardContent>
        {/* `noValidate` : toutes les erreurs passent par Zod et s'affichent
            sous les champs, jamais dans une bulle du navigateur. */}
        <form onSubmit={handleSubmit(envoyer)} noValidate>
          <Stack gap="lg">
            <AnimatedField index={0}>
              <SectionHeader title="Nous avons trouvé votre entreprise" />
            </AnimatedField>

            <AnimatedField index={1}>
              <Panel>
                <Stack>
                  <SectionHeader
                    size="md"
                    as="p"
                    title={formaterNom(company.nom)}
                    description={formaterNom(company.ville)}
                    aside={<OpcoBadge opco={opco} />}
                  />
                  <SegmentedControl
                    label="Nombre de salariés"
                    options={OPTIONS_TAILLE}
                    value={taille}
                    onValueChange={(t) => {
                      onTailleChange(t)
                      setTailleManquante(false)
                    }}
                    error={tailleManquante ? "Indiquez la taille de votre entreprise" : undefined}
                  />
                </Stack>
              </Panel>
            </AnimatedField>

            <AnimatedField index={2}>
              <Stack>
                <Heading size="md">Recevez votre budget formation</Heading>
                <FieldGrid>
                  <FormField label="Prénom" error={errors.prenom?.message}>
                    <Input id="prenom" autoComplete="given-name" {...register("prenom")} />
                  </FormField>
                  <FormField label="Nom" error={errors.nom?.message}>
                    <Input id="nom" autoComplete="family-name" {...register("nom")} />
                  </FormField>
                  <FormField label="Téléphone" error={errors.telephone?.message}>
                    <Input id="telephone" type="tel" autoComplete="tel" {...register("telephone")} />
                  </FormField>
                  <FormField label="Email" error={errors.email?.message}>
                    <Input id="email" type="email" autoComplete="email" {...register("email")} />
                  </FormField>
                </FieldGrid>
              </Stack>
            </AnimatedField>

            <AnimatedField index={3}>
              <CheckboxField
                id="consent"
                checked={consentRgpd}
                onCheckedChange={(checked) => setValue("consentRgpd", checked)}
                error={errors.consentRgpd?.message}
                label={
                  <>
                    J&apos;accepte d&apos;être recontacté(e) au sujet de mon projet de
                    formation, conformément à la{" "}
                    {PRIVACY_POLICY_URL ? (
                      <TextLink variant="inline" href={PRIVACY_POLICY_URL} external>
                        politique de confidentialité
                      </TextLink>
                    ) : (
                      "politique de confidentialité"
                    )}
                    .
                  </>
                }
              />
            </AnimatedField>

            {error && (
              <AnimatedField index={4}>
                <ErrorAlert>{error}</ErrorAlert>
              </AnimatedField>
            )}

            <AnimatedField index={5}>
              <FormActions>
                <Button type="submit" size="lg" loading={loading}>
                  Voir mon budget
                </Button>
                <Button type="button" size="lg" variant="ghost" onClick={onBack}>
                  Retour
                </Button>
              </FormActions>
            </AnimatedField>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}
