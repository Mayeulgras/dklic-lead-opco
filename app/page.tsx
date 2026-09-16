import { DotBackground } from "@/components/dot-background"
import { Logo } from "@/components/logo"
import { MultiStepForm } from "@/components/multi-step-form/multi-step-form"

export default function Home() {
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-background">
      <DotBackground className="text-primary/20" />

      {/* Le shell reste figé sur le viewport pour que le fond animé le couvre
          sans défiler ; c'est ce conteneur qui scrolle quand le contenu d'une
          étape dépasse. Sur ordinateur, le formulaire y est centré verticalement
          par `my-auto` (et non `justify-center`, qui couperait le haut du contenu
          dès qu'il dépasse la hauteur de l'écran). Le padding haut dégage le logo. */}
      <main className="relative z-10 flex flex-1 flex-col items-center overflow-y-auto overscroll-contain px-4 pt-24 pb-12 sm:px-6 sm:py-28">
        <Logo />
        <MultiStepForm />
      </main>
    </div>
  )
}
