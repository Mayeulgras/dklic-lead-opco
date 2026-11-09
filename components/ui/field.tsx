"use client"

import { Field as FieldPrimitive } from "@base-ui/react/field"

import { labelClassName } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Champ de formulaire : relie automatiquement l'étiquette, le champ et le
 * message d'erreur (attributs `for`, `aria-describedby`, `aria-invalid`).
 *
 * La validation reste celle du formulaire (React Hook Form + Zod) : on passe
 * simplement `invalid` à `Field` quand il y a une erreur à afficher.
 */

type AvecClasse<P> = Omit<P, "className"> & { className?: string }

function Field({ className, ...props }: AvecClasse<FieldPrimitive.Root.Props>) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function FieldLabel({ className, ...props }: AvecClasse<FieldPrimitive.Label.Props>) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(labelClassName, className)}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: AvecClasse<FieldPrimitive.Description.Props>) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn("text-small text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Toujours affichée quand elle est rendue : c'est l'appelant qui décide. */
function FieldError({
  className,
  match = true,
  ...props
}: AvecClasse<FieldPrimitive.Error.Props>) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      match={match}
      className={cn("text-small text-destructive", className)}
      {...props}
    />
  )
}

export { Field, FieldLabel, FieldDescription, FieldError }
