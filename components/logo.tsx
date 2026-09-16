import Image from "next/image"

import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("fixed top-6 left-6 z-20 select-none", className)}>
      {/* Le SVG est carré (viewBox 0 0 400 400) : il faut déclarer 80×80, sinon
          Next réserve une hauteur de 40 px alors que l'image en occupe 80.
          En dessous de `sm`, la taille descend à 56 px pour dégager le stepper,
          qui démarre à 96 px du haut sur mobile contre 128 px au-delà. */}
      <Image
        src="/dklic-logo.svg"
        alt="dklic"
        width={80}
        height={80}
        priority
        className="size-14 sm:size-20"
      />
    </div>
  )
}
