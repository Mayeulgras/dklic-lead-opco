"use client"

import { useId } from "react"

import { Field, FieldError } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/**
 * Choix unique parmi quelques options courtes, présentées côte à côte. Une
 * fois une option choisie, on ne peut plus revenir à « aucune ».
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  error,
}: {
  label: React.ReactNode
  options: { value: T; label: React.ReactNode }[]
  value: T | null
  onValueChange: (value: T) => void
  error?: string
}) {
  const labelId = useId()

  return (
    <Field invalid={!!error}>
      <Label id={labelId}>{label}</Label>
      <ToggleGroup<T>
        aria-labelledby={labelId}
        value={value ? [value] : []}
        onValueChange={(selection) => {
          // Un clic sur l'option déjà choisie la désélectionnerait : on l'ignore.
          if (selection[0]) onValueChange(selection[0])
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem<T> key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
