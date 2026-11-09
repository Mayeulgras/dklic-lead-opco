import { DotBackground } from "./dot-background"
import { Logo } from "./logo"

/**
 * Cadre de la page : fond sable animé, logo, et une colonne centrée pour le
 * contenu.
 *
 * Le cadre reste figé sur l'écran pour que le fond animé le couvre sans
 * défiler ; c'est la zone `main` qui défile quand une étape dépasse. Sur
 * ordinateur, la colonne y est centrée verticalement par `my-auto` (et non
 * `justify-center`, qui couperait le haut du contenu dès qu'il dépasse la
 * hauteur de l'écran). Sur mobile elle reste en haut, sous le logo : la
 * centrer laissait un grand vide inutile. Le padding haut dégage le logo.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-background">
      <DotBackground />
      <main className="relative z-10 flex flex-1 flex-col items-center overflow-y-auto overscroll-contain px-4 pt-24 pb-12 sm:px-6 sm:py-28">
        <Logo />
        <div className="w-full max-w-2xl sm:my-auto">{children}</div>
      </main>
    </div>
  )
}
