import { Heading } from "./heading"
import { Stack } from "./stack"
import { Text } from "./text"

/**
 * En-tête d'une étape ou d'un encart : un titre, une ligne de description
 * facultative, et un élément aligné à droite (le badge OPCO, par exemple).
 */
export function SectionHeader({
  title,
  description,
  aside,
  size = "lg",
  as,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  aside?: React.ReactNode
  /** `lg` en tête d'étape, `md` dans un encart. */
  size?: "lg" | "md"
  as?: "h1" | "h2" | "h3" | "p"
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <Stack gap={size === "lg" ? "sm" : "xs"}>
        <Heading size={size} as={as}>
          {title}
        </Heading>
        {description && (
          <Text size={size === "lg" ? "base" : "small"} tone="muted">
            {description}
          </Text>
        )}
      </Stack>
      {aside}
    </div>
  )
}
