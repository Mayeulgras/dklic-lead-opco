"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

export function AnimatedField({
  children,
  index = 0,
  className,
}: {
  children: ReactNode
  index?: number
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
      transition={{
        duration: 0.3,
        delay: shouldReduceMotion ? 0 : index * 0.06,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  )
}
