"use client"

import { useMemo, useState } from "react"

import { Stack } from "@/components/elements/stack"
import { StepProgress } from "@/components/elements/step-progress"
import { StepTransition } from "@/components/elements/step-transition"
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
    <Stack gap="lg">
      <StepProgress
        steps={STEP_TITLES}
        value={activeStep}
        maxReached={maxReachedStep}
        onValueChange={setActiveStep}
      />

      <StepTransition stepKey={activeStep}>
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
          <StepResult company={company} opco={opco} taille={taille} onRappel={handleRappel} />
        )}
      </StepTransition>
    </Stack>
  )
}
