import { DotBackground } from "@/components/dot-background"
import { Logo } from "@/components/logo"
import { MultiStepForm } from "@/components/multi-step-form/multi-step-form"

export default function Home() {
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-background">
      <DotBackground className="text-primary/20" />

      <Logo />

      {/* Le shell reste figé sur le viewport pour que le fond animé le couvre
          sans défiler ; c'est ce conteneur qui scrolle quand le contenu d'une
          étape dépasse (l'étape 4 sur petit écran, notamment). */}
      <main className="relative z-10 flex flex-1 items-start justify-center overflow-y-auto overscroll-contain px-6 pt-24 pb-24 sm:pt-32">
        <MultiStepForm />
      </main>
    </div>
  )
}
