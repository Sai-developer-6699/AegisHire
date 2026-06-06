import React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-[#1a2e46]/60 animate-pulse rounded-md", className)}
      {...props} />
  )
}

export { Skeleton }
