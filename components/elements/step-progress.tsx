"use client"

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper"

/**
 * Barre de progression du parcours. Les étapes déjà atteintes restent
 * cliquables pour revenir en arrière ; les suivantes sont verrouillées.
 */
export function StepProgress({
  steps,
  value,
  maxReached,
  onValueChange,
}: {
  steps: string[]
  value: number
  /** Dernière étape atteignable (numérotée à partir de 1). */
  maxReached: number
  onValueChange: (step: number) => void
}) {
  return (
    <Stepper
      value={value}
      onValueChange={(step) => {
        if (step <= maxReached) onValueChange(step)
      }}
    >
      <StepperNav>
        {steps.map((title, i) => {
          const step = i + 1
          return (
            <StepperItem key={step} step={step} disabled={step > maxReached}>
              <StepperTrigger>
                <StepperIndicator>{step}</StepperIndicator>
                <StepperTitle>{title}</StepperTitle>
              </StepperTrigger>
              {i < steps.length - 1 && <StepperSeparator />}
            </StepperItem>
          )
        })}
      </StepperNav>
    </Stepper>
  )
}
