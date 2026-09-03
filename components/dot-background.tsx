import { cn } from "@/lib/utils"

export function DotBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("dot-drift pointer-events-none absolute inset-0", className)}
    />
  )
}
