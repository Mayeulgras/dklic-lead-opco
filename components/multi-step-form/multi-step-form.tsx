"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper"
import type { Company, ContactInfo, Formation, OpcoResult } from "@/lib/schemas/lead-form"
import { getLeadResult } from "@/app/actions/lead"
import { StepCompanySearch } from "./step-company-search"
import { StepCompanyConfirm } from "./step-company-confirm"
import { StepContact } from "./step-contact"
import { StepResult } from "./step-result"

const STEP_TITLES = ["Entreprise", "Confirmation", "Contact", "Résultat"]

export function MultiStepForm() {
  const [activeStep, setActiveStep] = useState(1)
  const [company, setCompany] = useState<Company | null>(null)
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ opco: OpcoResult; formations: Formation[] } | null>(
    null
  )

  // L'étape 4 n'est atteignable qu'une fois le résultat obtenu : si l'appel
  // échoue, l'utilisateur reste sur l'étape 3 avec le message d'erreur.
  const maxReachedStep = useMemo(() => {
    if (result) return 4
    if (contact) return 3
    if (company) return 2
    return 1
  }, [company, contact, result])

  const handleContactSubmit = async (data: ContactInfo) => {
    if (!company) return
    setContact(data)
    setLoading(true)
    setError(null)

    try {
      const leadResult = await getLeadResult(company)

      if (!leadResult.ok) {
        setError(leadResult.error)
        return
      }

      setResult({ opco: leadResult.opco, formations: leadResult.formations })
      setActiveStep(4)
    } catch {
      setError("Une erreur est survenue, merci de réessayer dans un instant")
    } finally {
      setLoading(false)
    }
  }

  const handleCta = (type: "financement" | "dossier") => {
    // TODO: déclencher la mise à jour du lead Odoo avec le type de demande choisi.
    console.log("CTA sélectionné:", type, { company, contact })
  }

  return (
    <div className="w-full max-w-2xl">
      <Stepper value={activeStep} onValueChange={(step) => {
        if (step <= maxReachedStep) setActiveStep(step)
      }}>
        <StepperNav className="mb-10">
          {STEP_TITLES.map((title, i) => {
            const step = i + 1
            return (
              <StepperItem key={step} step={step} disabled={step > maxReachedStep}>
                <StepperTrigger>
                  <StepperIndicator>{step}</StepperIndicator>
                  <StepperTitle className="hidden sm:block">{title}</StepperTitle>
                </StepperTrigger>
                {i < STEP_TITLES.length - 1 && <StepperSeparator />}
              </StepperItem>
            )
          })}
        </StepperNav>
      </Stepper>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {activeStep === 1 && (
            <StepCompanySearch
              onSelect={(c) => {
                setCompany(c)
                setActiveStep(2)
              }}
            />
          )}

          {activeStep === 2 && company && (
            <StepCompanyConfirm
              company={company}
              onChange={setCompany}
              onBack={() => setActiveStep(1)}
              onConfirm={() => setActiveStep(3)}
            />
          )}

          {activeStep === 3 && (
            <StepContact
              defaultValues={contact ?? {}}
              loading={loading}
              error={error}
              onBack={() => setActiveStep(2)}
              onSubmit={handleContactSubmit}
            />
          )}

          {activeStep === 4 && result && (
            <StepResult
              opco={result.opco}
              formations={result.formations}
              onCta={handleCta}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
