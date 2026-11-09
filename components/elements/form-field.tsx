"use client"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"

/**
 * Un champ complet : étiquette, champ (en enfant), aide facultative et erreur
 * sous le champ. Étiquette et erreur sont reliées au champ automatiquement.
 */
export function FormField({
  label,
  description,
  error,
  children,
}: {
  label: React.ReactNode
  description?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <Field invalid={!!error}>
      <FieldLabel>{label}</FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}

/** Grille de champs : une colonne sur mobile, deux au-delà. */
export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">{children}</div>
}
