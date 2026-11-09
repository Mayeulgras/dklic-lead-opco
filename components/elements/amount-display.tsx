import { cn } from "@/lib/utils"
import { Panel } from "./panel"
import { Stack } from "./stack"
import { Text } from "./text"

/**
 * Le chiffre mis en avant (le budget), dans un grand encart sable, avec sa
 * phrase d'explication. `compact` réduit la taille pour un texte long, comme
 * une fourchette « 1 100 € – 8 000 € ».
 */
export function AmountDisplay({
  value,
  caption,
  compact = false,
}: {
  value: string
  caption: React.ReactNode
  compact?: boolean
}) {
  return (
    <Panel size="lg">
      <Stack gap="sm">
        <p
          data-slot="amount"
          className={cn(
            "leading-none font-semibold tracking-tight tabular-nums",
            compact ? "text-display-sm" : "text-display"
          )}
        >
          {value}
        </p>
        <Text tone="muted">{caption}</Text>
      </Stack>
    </Panel>
  )
}
