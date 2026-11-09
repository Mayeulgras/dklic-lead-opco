import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * Bloc d'erreur pour ce qui ne dépend pas d'un champ précis : service
 * indisponible, envoi refusé. L'erreur d'un champ s'affiche sous le champ
 * (`FormField`).
 */
export function ErrorAlert({
  title = "Erreur",
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
