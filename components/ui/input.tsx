import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Style unique des champs de saisie, partagé avec le champ de recherche
 * d'entreprise (`ComboboxInput`), qui ne peut pas réutiliser ce composant.
 *
 * Texte toujours à 16 px (`text-field`) : en dessous, Safari iOS zoome tout
 * seul à la saisie.
 */
export const inputClassName =
  "h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-field transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputClassName, className)}
      {...props}
    />
  )
}

export { Input }
