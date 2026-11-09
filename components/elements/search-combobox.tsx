"use client"

import { useEffect, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
} from "@/components/ui/combobox"
import { Spinner } from "@/components/ui/spinner"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { FormField } from "./form-field"

/**
 * Recherche avec suggestions venues d'un service distant. Le composant gère la
 * saisie, l'attente entre deux frappes et l'affichage de la liste ; l'appelant
 * reçoit la recherche (`onSearch`) et fournit les résultats (`items`).
 *
 * La liste ne s'ouvre qu'à partir de `minChars` caractères, une fois la frappe
 * terminée : on n'affiche jamais « aucun résultat » pour une recherche qui n'a
 * pas encore été lancée.
 */
export function SearchCombobox<T>({
  id,
  label,
  placeholder,
  items,
  loading,
  onSearch,
  onSelect,
  itemKey,
  itemLabel,
  renderItem,
  emptyMessage = "Aucun résultat",
  loadingMessage = "Recherche en cours...",
  minChars = 2,
  delay = 350,
}: {
  id: string
  label: React.ReactNode
  placeholder?: string
  items: T[]
  loading: boolean
  /** Reçoit la recherche, sans espaces superflus, une fois la frappe terminée. */
  onSearch: (query: string) => void
  onSelect: (item: T) => void
  itemKey: (item: T) => string
  /** Texte repris dans le champ quand on choisit un résultat. */
  itemLabel: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  emptyMessage?: string
  loadingMessage?: string
  minChars?: number
  delay?: number
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const recherche = useDebouncedValue(query, delay).trim()
  const prete = recherche.length >= minChars

  useEffect(() => {
    onSearch(recherche)
  }, [recherche, onSearch])

  return (
    <Combobox
      items={items}
      // Les résultats sont déjà filtrés par le service.
      filter={null}
      inputValue={query}
      onInputValueChange={setQuery}
      open={open && prete}
      onOpenChange={setOpen}
      itemToStringLabel={itemLabel}
      isItemEqualToValue={(a: T, b: T) => itemKey(a) === itemKey(b)}
      onValueChange={(item: T | null) => {
        if (item) onSelect(item)
      }}
    >
      <FormField label={label}>
        <ComboboxInput id={id} placeholder={placeholder} />
      </FormField>

      <ComboboxContent>
        {loading ? (
          <ComboboxStatus>
            <Spinner />
            {loadingMessage}
          </ComboboxStatus>
        ) : (
          <>
            <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
            <ComboboxList>
              {(item: T) => (
                <ComboboxItem key={itemKey(item)} value={item}>
                  {renderItem(item)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </>
        )}
      </ComboboxContent>
    </Combobox>
  )
}
