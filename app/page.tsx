import { PageShell } from "@/components/elements/page-shell"
import { MultiStepForm } from "@/components/multi-step-form/multi-step-form"
import { chargerCatalogue } from "@/lib/catalogue"

/**
 * La page est générée à l'avance puis rafraîchie au plus une fois par heure :
 * le catalogue des formations y est inclus, sans attente à l'étape 3.
 */
export const revalidate = 3600

export default async function Home() {
  const catalogue = await chargerCatalogue()

  return (
    <PageShell>
      <MultiStepForm catalogue={catalogue} />
    </PageShell>
  )
}
