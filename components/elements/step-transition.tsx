"use client"

import { AnimatePresence, motion, useReducedMotion } from "motion/react"

/**
 * Glissement d'une étape à l'autre : l'ancienne sort vers la gauche, la
 * nouvelle entre par la droite. Désactivé quand le visiteur a demandé à son
 * système de réduire les animations.
 */
export function StepTransition({
  stepKey,
  children,
}: {
  stepKey: string | number
  children: React.ReactNode
}) {
  const reduire = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={reduire ? false : { opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduire ? undefined : { opacity: 0, x: -16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
