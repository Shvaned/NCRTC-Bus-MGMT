"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const online = () => setIsOffline(false)
    const offline = () => setIsOffline(true)
    window.addEventListener("online", online)
    window.addEventListener("offline", offline)
    return () => {
      window.removeEventListener("online", online)
      window.removeEventListener("offline", offline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-sm text-white">
      <WifiOff className="size-4" />
      You are offline. Some features may be unavailable.
    </div>
  )
}
