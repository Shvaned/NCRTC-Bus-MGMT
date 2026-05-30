"use client"

import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
          },
        }}
      />
    </TooltipProvider>
  )
}
