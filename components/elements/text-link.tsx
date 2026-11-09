import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textLinkVariants = cva("underline-offset-4", {
  variants: {
    variant: {
      /** Lien seul, qui déclenche une action (« Saisir le SIRET »). */
      action: "text-left text-small font-medium text-primary hover:underline",
      /** Lien au milieu d'une phrase : toujours souligné pour rester repérable. */
      inline: "text-foreground underline",
    },
  },
  defaultVariants: { variant: "action" },
})

type Variante = { variant?: "action" | "inline" }

type LienProps = Variante &
  React.ComponentProps<"a"> & {
    href: string
    /**
     * Ouvre dans un nouvel onglet. À utiliser pour toute page externe : la
     * progression du formulaire vit dans la page, une navigation sortante la
     * perdrait entièrement.
     */
    external?: boolean
  }

type BoutonProps = Variante & React.ComponentProps<"button"> & { href?: undefined }

/** Le seul style de lien de l'application : une adresse (`href`) ou une action. */
export function TextLink(props: LienProps | BoutonProps) {
  if (props.href !== undefined) {
    const { variant, external, className, ...rest } = props
    return (
      <a
        className={cn(textLinkVariants({ variant }), className)}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      />
    )
  }

  const { variant, className, ...rest } = props
  return (
    <button type="button" className={cn(textLinkVariants({ variant }), className)} {...rest} />
  )
}
