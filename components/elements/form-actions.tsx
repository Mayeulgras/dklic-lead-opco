/**
 * Rangée de boutons en bas d'une étape, le bouton principal en premier. Sur
 * mobile, les boutons s'empilent en pleine largeur ; au-delà, ils s'alignent.
 */
export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 sm:flex-row">{children}</div>
}
