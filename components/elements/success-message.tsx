import { CheckCircle2 } from "lucide-react"

/** Confirmation d'une action, en vert, annoncée aux lecteurs d'écran. */
export function SuccessMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="flex items-center gap-2 font-medium text-primary">
      <CheckCircle2 className="size-5 shrink-0" />
      {children}
    </p>
  )
}
