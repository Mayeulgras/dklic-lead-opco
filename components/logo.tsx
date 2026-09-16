import Image from "next/image"

import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    // `absolute` et non `fixed` : le logo est placé dans la zone qui défile, il
    // part donc avec le contenu. En `fixed`, il restait à l'écran et passait
    // par-dessus la carte dès qu'on faisait défiler une étape longue sur mobile.
    <div className={cn("absolute top-6 left-4 z-20 select-none sm:left-6", className)}>
      {/* Le SVG est carré (viewBox 0 0 400 400) : il faut déclarer 80×80, sinon
          Next réserve une hauteur de 40 px alors que l'image en occupe 80.
          En dessous de `sm`, la taille descend à 56 px pour dégager le stepper,
          qui démarre à 96 px du haut sur mobile contre 112 px au-delà. */}
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
