import { Children } from "react"

/**
 * Rangée de petites cartes. Sur mobile, elle défile au doigt et laisse
 * dépasser le bord de la carte suivante, pour qu'on comprenne qu'il y en a
 * d'autres ; au-delà de 640 px, les cartes se rangent en grille de trois.
 *
 * À placer dans le contenu d'une `Card` : sur mobile, la rangée déborde dans
 * ses marges pour aller jusqu'au bord.
 */
export function CardCarousel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <ul
      aria-label={label}
      className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0"
    >
      {Children.map(children, (enfant) => (
        <li className="flex w-[78%] shrink-0 snap-start sm:w-auto">{enfant}</li>
      ))}
    </ul>
  )
}
