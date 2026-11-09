import { Badge } from "@/components/ui/badge"
import { libelleOpco, type OpcoId } from "@/lib/financement/opcos"

/** L'OPCO détecté, ou « OPCO non identifié » quand aucune convention n'est déclarée. */
export function OpcoBadge({ opco }: { opco: OpcoId | null }) {
  return opco ? (
    <Badge size="lg">{libelleOpco(opco)}</Badge>
  ) : (
    <Badge size="lg" variant="outline">
      OPCO non identifié
    </Badge>
  )
}
