"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Bouton à deux états (enfoncé ou non) : contour blanc au repos, vert dklic une
 * fois enfoncé. C'est aussi le style des boutons de choix de `ToggleGroup`.
 */
const toggleVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface font-medium whitespace-nowrap transition-colors outline-none hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-10 gap-2 px-4 text-base [&_svg:not([class*='size-'])]:size-4",
        sm: "h-8 gap-1.5 px-3 text-small [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: { size: "default" },
  }
)

function Toggle<Value extends string>({
  className,
  size,
  ...props
}: Omit<TogglePrimitive.Props<Value>, "className"> &
  VariantProps<typeof toggleVariants> & { className?: string }) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ size }), className)}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
