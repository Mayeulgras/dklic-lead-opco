import assert from "node:assert/strict"
import { describe, it } from "vitest"

import { cn } from "./utils"

describe("cn", () => {
  it("garde les tailles de l'échelle à côté d'une couleur de texte", () => {
    assert.equal(cn("text-small text-muted-foreground"), "text-small text-muted-foreground")
    assert.equal(cn("text-display text-primary"), "text-display text-primary")
    assert.equal(cn("text-field text-foreground"), "text-field text-foreground")
  })

  it("remplace une taille par une autre", () => {
    assert.equal(cn("text-small", "text-sub"), "text-sub")
    assert.equal(cn("text-display", "text-display-sm"), "text-display-sm")
  })
})
