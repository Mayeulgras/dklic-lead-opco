import * as React from "react"
import { cn } from "@/lib/utils"
import { Input as InputPrimitive } from "@/components/ui/input"

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      className={cn(
        // Toujours 16 px, indépendamment de l'échelle du site : en dessous,
        // Safari iOS zoome tout seul à la saisie. `md:text-[16px]` annule le
        // `md:text-sm` du composant de base, qui repasserait le champ en 14 px.
        "h-10 w-full min-w-0 rounded-lg border border-border bg-white px-3 py-2 text-[16px] md:text-[16px]",
        className
      )}
      {...props}
    />
  )
}
