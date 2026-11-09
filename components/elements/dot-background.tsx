import { cn } from "@/lib/utils"

/** Nuage de points vert pâle qui dérive vers le haut à droite (voir `.dot-drift`). */
export function DotBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("dot-drift pointer-events-none absolute inset-0 text-primary/20", className)}
    />
  )
}
