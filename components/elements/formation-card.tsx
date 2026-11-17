"use client"

import Image from "next/image"
import { Check, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Toggle } from "@/components/ui/toggle"
import type { Formation } from "@/lib/formations/selection"
import { Heading } from "./heading"
import { Stack } from "./stack"
import { Text } from "./text"
import { TextLink } from "./text-link"

/**
 * Une formation du catalogue dklic : image, pôle, titre, accroche. Le bouton
 * « M'intéresse » la retient pour la demande de rappel ; « Programme » ouvre
 * sa page sur le site dklic dans un nouvel onglet.
 *
 * Fond surface et arrondi `xl` : un encart posé dans une carte `2xl`.
 */
export function FormationCard({
  formation,
  selected,
  onSelectedChange,
  disabled,
}: {
  formation: Formation
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  disabled?: boolean
}) {
  const pole = formation.poles[0]

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-foreground/10 data-[selected]:ring-2 data-[selected]:ring-primary" data-selected={selected || undefined}>
      <div className="relative aspect-[16/10] bg-muted">
        {/* Image décorative : le titre dit déjà tout. */}
        <Image
          src={formation.image}
          alt=""
          fill
          sizes="(min-width: 640px) 200px, 78vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {pole && <Badge variant="secondary">{pole}</Badge>}

        <Stack gap="xs">
          <Heading size="sm" as="h3">
            {formation.nom}
          </Heading>
          {formation.accroche && (
            <Text size="small" tone="muted" className="line-clamp-3">
              {formation.accroche}
            </Text>
          )}
        </Stack>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <Toggle
            size="sm"
            pressed={selected}
            onPressedChange={onSelectedChange}
            disabled={disabled}
            // Le nom de la formation distingue les boutons pour un lecteur d'écran.
            aria-label={`M'intéresse : ${formation.nom}`}
          >
            {selected ? <Check /> : <Plus />}
            M&apos;intéresse
          </Toggle>
          <TextLink
            href={formation.url}
            external
            aria-label={`Programme : ${formation.nom} (nouvel onglet)`}
          >
            Programme
          </TextLink>
        </div>
      </div>
    </article>
  )
}
