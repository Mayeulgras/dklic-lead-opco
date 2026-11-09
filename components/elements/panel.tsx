import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const panelVariants = cva("rounded-xl bg-secondary", {
  variants: {
    size: {
      /** Encart d'information (l'entreprise trouvée). */
      md: "p-4 sm:p-5",
      /** Encart mis en avant (le montant du budget). */
      lg: "p-6 sm:p-8",
    },
  },
  defaultVariants: { size: "md" },
})

/** Encart sable posé dans une carte. */
export function Panel({
  size,
  className,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof panelVariants>) {
  return <div data-slot="panel" className={cn(panelVariants({ size }), className)} {...props} />
}
