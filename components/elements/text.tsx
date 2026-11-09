import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    size: {
      base: "text-base",
      small: "text-small",
      /** Mentions légales : petites, donc plus aérées. */
      sub: "text-sub leading-relaxed",
    },
    tone: {
      default: "",
      muted: "text-muted-foreground",
      primary: "text-primary",
    },
    weight: {
      normal: "",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
  defaultVariants: { size: "base", tone: "default", weight: "normal" },
})

type TextTag = "p" | "span" | "div"

/** Tous les textes courants : taille, couleur et graisse viennent de l'échelle. */
export function Text({
  size,
  tone,
  weight,
  as: Tag = "p",
  className,
  ...props
}: React.ComponentProps<"p"> & VariantProps<typeof textVariants> & { as?: TextTag }) {
  return <Tag className={cn(textVariants({ size, tone, weight }), className)} {...props} />
}
