"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-card border border-border p-4 shadow-lg max-w-sm mx-auto">
      <Download className="size-5 text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Install NCRTC BMS</p>
        <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
      </div>
      <Button size="sm" onClick={() => (deferredPrompt as any)?.prompt()}>Install</Button>
      <button className="shrink-0" onClick={() => setShowPrompt(false)}><X className="size-4 text-muted-foreground" /></button>
    </div>
  )
}
