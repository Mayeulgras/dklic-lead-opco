import * as React from "react"
import { cn } from "@/lib/utils"
import { Input as InputPrimitive } from "@/components/ui/input"

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      className={cn(
        "h-8 w-full min-w-0 rounded-md border border-border bg-white px-2.5 py-1 text-base",
        className
      )}
      {...props}
    />
  )
}
