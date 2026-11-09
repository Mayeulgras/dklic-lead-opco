"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

/**
 * Case à cocher suivie de son texte (qui peut contenir un lien) et de son
 * erreur. Cliquer sur le texte coche la case.
 */
export function CheckboxField({
  id,
  checked,
  onCheckedChange,
  label,
  error,
}: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: React.ReactNode
  error?: string
}) {
  return (
    <Field invalid={!!error}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          className="mt-0.5"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        {/* `block` : l'étiquette de base est en flex, ce qui éclaterait le
            texte et le lien en colonnes séparées. */}
        <FieldLabel className="block leading-relaxed font-normal text-muted-foreground">
          {label}
        </FieldLabel>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
