import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headingVariants = cva("font-semibold", {
  variants: {
    size: {
      /** Titre d'étape (22 px). */
      lg: "text-heading leading-tight",
      /** Sous-titre, nom d'entreprise (17 px). */
      md: "text-title leading-snug",
    },
  },
  defaultVariants: { size: "lg" },
})

type HeadingTag = "h1" | "h2" | "h3" | "p"

/**
 * Tous les titres de l'application. La balise suit la hiérarchie de la page
 * (`as`), la taille suit le rôle visuel (`size`) : les deux sont indépendants.
 */
export function Heading({
  size = "lg",
  as,
  className,
  ...props
}: React.ComponentProps<"h2"> & { size?: "lg" | "md"; as?: HeadingTag }) {
  const Tag = as ?? (size === "lg" ? "h2" : "h3")
  return <Tag className={cn(headingVariants({ size }), className)} {...props} />
}
