import { Check } from "lucide-react"

/** Courte liste d'arguments précédés d'une coche, sur une ou plusieurs lignes. */
export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-small font-medium">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-1.5">
          <Check className="size-4 text-primary" />
          {item}
        </li>
      ))}
    </ul>
  )
}
