import Image from "next/image"

import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("fixed top-6 left-6 z-20 select-none", className)}>
      <Image src="/dklic-logo.svg" alt="dklic" width={80} height={40} priority />
    </div>
  )
}
