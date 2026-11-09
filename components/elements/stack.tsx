import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      /** 4 px : un titre et sa ligne d'information. */
      xs: "gap-1",
      /** 8 px : une étiquette et son champ, un titre et sa description. */
      sm: "gap-2",
      /** 20 px : les éléments d'un même bloc. */
      md: "gap-5",
      /** 24 px sur mobile, 32 px au-delà : les blocs d'une étape. */
      lg: "gap-6 sm:gap-8",
    },
  },
  defaultVariants: { gap: "md" },
})

/**
 * Empile ses enfants verticalement. Les quatre espacements ci-dessus sont les
 * seuls utilisés entre éléments dans l'application.
 */
export function Stack({
  gap,
  className,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof stackVariants>) {
  return <div className={cn(stackVariants({ gap }), className)} {...props} />
}
