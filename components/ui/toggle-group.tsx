"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"

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
      className={cn(
        "h-10 flex-1 rounded-lg border border-border bg-surface px-2 text-base font-medium whitespace-nowrap transition-colors outline-none hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        "data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
