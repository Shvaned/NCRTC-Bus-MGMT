"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface SlidingDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  side?: "left" | "right"
  className?: string
  overlayClassName?: string
}

export function SlidingDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  className,
  overlayClassName,
}: SlidingDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn("sm:max-w-lg w-full overflow-auto", className)} overlayClassName={overlayClassName}>
        <SheetHeader className="mb-4">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
