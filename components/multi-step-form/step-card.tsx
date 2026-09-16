import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Carte blanche commune aux trois étapes : fond opaque pour que le texte ne
 * repose jamais sur le nuage de points animé, et un seul endroit où régler
 * marges, arrondis et taille de texte.
 *
 * Hiérarchie des arrondis : carte `2xl` > blocs internes `xl` > champs et
 * boutons `lg`. Un élément imbriqué est toujours moins arrondi que son parent.
 */
export function StepCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card
      className={cn(
        "rounded-2xl bg-white text-base [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]",
        className
      )}
    >
      <CardContent>{children}</CardContent>
    </Card>
  )
}
