import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Les tailles de texte de l'échelle dklic (voir `app/globals.css`). Sans cette
 * déclaration, `tailwind-merge` les prend pour des couleurs : dans
 * `text-small text-muted-foreground`, il garderait la couleur et supprimerait
 * la taille.
 */
const TAILLES_DE_TEXTE = ["sub", "small", "title", "heading", "field", "display", "display-sm"]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TAILLES_DE_TEXTE }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
