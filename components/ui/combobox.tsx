"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"

import { inputClassName } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Champ avec liste de suggestions, sur Base UI : navigation au clavier
 * (flèches, Entrée, Échap), annonces aux lecteurs d'écran, fermeture au clic
 * extérieur. La liste s'ouvre dans un portail, au-dessus de la carte.
 */

type AvecClasse<P> = Omit<P, "className"> & { className?: string }

const Combobox = ComboboxPrimitive.Root

function ComboboxInput({ className, ...props }: AvecClasse<ComboboxPrimitive.Input.Props>) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(inputClassName, className)}
      {...props}
    />
  )
}

function ComboboxContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: AvecClasse<ComboboxPrimitive.Popup.Props> & { sideOffset?: number }) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner sideOffset={sideOffset} className="z-30 outline-none">
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "w-(--anchor-width) max-w-(--available-width) overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none",
            className
          )}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: AvecClasse<ComboboxPrimitive.List.Props>) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn("max-h-80 overflow-y-auto py-1.5 empty:hidden", className)}
      {...props}
    />
  )
}

function ComboboxItem({ className, ...props }: AvecClasse<ComboboxPrimitive.Item.Props>) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "flex w-full cursor-pointer flex-col items-start gap-0.5 px-4 py-3 text-left outline-none select-none data-highlighted:bg-muted",
        className
      )}
      {...props}
    />
  )
}

/** Message affiché par Base UI seulement quand la liste est vide. */
function ComboboxEmpty({ className, ...props }: AvecClasse<ComboboxPrimitive.Empty.Props>) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn("px-4 py-4 text-small text-muted-foreground empty:hidden", className)}
      {...props}
    />
  )
}

/** État en cours (chargement…), annoncé aux lecteurs d'écran. */
function ComboboxStatus({ className, ...props }: AvecClasse<ComboboxPrimitive.Status.Props>) {
  return (
    <ComboboxPrimitive.Status
      data-slot="combobox-status"
      className={cn(
        "flex items-center gap-2 px-4 py-4 text-small text-muted-foreground empty:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxStatus,
}
