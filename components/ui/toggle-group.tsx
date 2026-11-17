"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

import { toggleVariants } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

/**
 * Rangée de boutons dont un seul est enfoncé à la fois. Navigation au clavier
 * par les flèches, fournie par Base UI.
 */
function ToggleGroup<Value extends string>({
  className,
  ...props
}: Omit<ToggleGroupPrimitive.Props<Value>, "className"> & { className?: string }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn("flex w-full gap-2", className)}
      {...props}
    />
  )
}

function ToggleGroupItem<Value extends string>({
  className,
  ...props
}: Omit<TogglePrimitive.Props<Value>, "className"> & { className?: string }) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      // Même style qu'un `Toggle`, étiré et resserré pour tenir à trois sur 390 px.
      className={cn(toggleVariants(), "flex-1 px-2", className)}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
