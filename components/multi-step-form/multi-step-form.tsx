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
import { soumettreDemande } from "@/app/actions/lead"
import { tailleDepuisTranche, type Taille } from "@/lib/financement/effectif"
import { resoudreOpco } from "@/lib/financement/opco-resolution"
import type { Company, ContactInfo } from "@/lib/schemas/lead-form"
import { StepCompanySearch } from "./step-company-search"
import { StepCoordonnees } from "./step-coordonnees"
import { StepResult } from "./step-result"

const STEP_TITLES = ["Entreprise", "Coordonnées", "Budget"]

export function MultiStepForm() {
  const [activeStep, setActiveStep] = useState(1)
  const [company, setCompany] = useState<Company | null>(null)
  const [taille, setTaille] = useState<Taille | null>(null)
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [envoye, setEnvoye] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // L'OPCO se déduit de la convention collective renvoyée par la recherche :
  // simple lecture de table, sans appel réseau.
  const opco = useMemo(() => (company ? resoudreOpco(company.idcc) : null), [company])

  // Le budget n'est atteignable qu'une fois les coordonnées envoyées.
  const maxReachedStep = envoye ? 3 : company ? 2 : 1

  const handleSelect = (c: Company) => {
    setCompany(c)
    setTaille(tailleDepuisTranche(c.effectif))
    setEnvoye(false)
    setError(null)
    setActiveStep(2)
  }

  const handleSubmit = async (data: ContactInfo) => {
    if (!company) return
    setContact(data)
    setLoading(true)
    setError(null)

    try {
      const resultat = await soumettreDemande(company, data)

      if (!resultat.ok) {
        setError(resultat.error)
        return
      }

      setEnvoye(true)
      setActiveStep(3)
    } catch {
      setError("Une erreur est survenue, merci de réessayer dans un instant")
    } finally {
      setLoading(false)
    }
  }

  const handleRappel = () => {
    // TODO: signaler la demande de rappel sur le lead Odoo.
    console.log("Rappel demandé :", { company, contact, opco, taille })
  }

  return (
    // `sm:my-auto` : centré verticalement sur ordinateur. Sur mobile on reste en
    // haut, sous le logo — centrer y laissait un grand vide inutile.
    <div className="w-full max-w-2xl sm:my-auto">
      <Stepper
        value={activeStep}
        onValueChange={(step) => {
          if (step <= maxReachedStep) setActiveStep(step)
        }}
      >
        <StepperNav className="mb-6 sm:mb-8">
          {STEP_TITLES.map((title, i) => {
            const step = i + 1
            return (
              <StepperItem key={step} step={step} disabled={step > maxReachedStep}>
                <StepperTrigger>
                  <StepperIndicator className="size-8 text-sm font-semibold data-[state=inactive]:bg-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:ring-1 data-[state=inactive]:ring-foreground/15">
                    {step}
                  </StepperIndicator>
                  {/* Sur mobile, seul le nom de l'étape en cours s'affiche :
                      les trois ne tiennent pas en 390 px. */}
                  <StepperTitle className="hidden text-sm data-[state=active]:block sm:block">
                    {title}
                  </StepperTitle>
                </StepperTrigger>
                {i < STEP_TITLES.length - 1 && (
                  <StepperSeparator className="mx-2 bg-foreground/10 data-[state=completed]:bg-primary" />
                )}
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
          {activeStep === 1 && <StepCompanySearch onSelect={handleSelect} />}

          {activeStep === 2 && company && (
            <StepCoordonnees
              company={company}
              opco={opco}
              taille={taille}
              onTailleChange={setTaille}
              defaultValues={contact ?? {}}
              loading={loading}
              error={error}
              onBack={() => setActiveStep(1)}
              onSubmit={handleSubmit}
            />
          )}

          {activeStep === 3 && envoye && company && taille && (
            <StepResult
              company={company}
              opco={opco}
              taille={taille}
              onRappel={handleRappel}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
