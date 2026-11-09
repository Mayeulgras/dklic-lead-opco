import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/** Roue de chargement, partout la même : dans les boutons comme dans les listes. */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2
      role="status"
      aria-label="Chargement"
      data-slot="spinner"
      className={cn("size-4 shrink-0 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
