"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePanic } from "@/modules/ims/hooks/use-incidents"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Shield, CheckCircle, Loader2, Clock } from "lucide-react"

export default function PanicPage() {
  const router = useRouter()
  const panicMutation = usePanic()
  const [phase, setPhase] = useState<"idle" | "holding" | "triggered" | "done">("idle")
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimer = useRef<NodeJS.Timeout | null>(null)
  const progressTimer = useRef<NodeJS.Timeout | null>(null)
  const holdStartTime = useRef(0)

  const clearTimers = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null }
    if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  function startHold() {
    setPhase("holding")
    setHoldProgress(0)
    holdStartTime.current = Date.now()

    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTime.current
      const progress = Math.min(100, (elapsed / 2500) * 100)
      setHoldProgress(progress)

      if (progress >= 100) {
        clearTimers()
        triggerPanic()
      }
    }, 50)

    holdTimer.current = setTimeout(() => {
      triggerPanic()
    }, 2500)
  }

  function cancelHold() {
    clearTimers()
    setPhase("idle")
    setHoldProgress(0)
  }

  function triggerPanic() {
    setPhase("triggered")

    // Get location
    let latitude: number | null = null
    let longitude: number | null = null
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          panicMutation.mutate(
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
            { onSuccess: () => setPhase("done") }
          )
        },
        () => {
          panicMutation.mutate({}, { onSuccess: () => setPhase("done") })
        },
        { timeout: 5000 }
      )
    } else {
      panicMutation.mutate({}, { onSuccess: () => setPhase("done") })
    }
  }

  if (phase === "done") {
    return (
      <div className="max-w-lg mx-auto pt-16">
        <Card className="border-emerald-500/30">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="size-16 text-emerald-400 mx-auto" />
            <h1 className="text-xl font-bold">Alert Sent</h1>
            <p className="text-sm text-muted-foreground">Emergency incident has been created. Help is on the way.</p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => router.push("/driver/incidents")}>View Incidents</Button>
              <Button onClick={() => router.push("/driver")}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pt-16">
      <Card className="border-red-500/20">
        <CardContent className="py-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="size-12 text-red-400" />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-red-400">Emergency Panic</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Hold the button for 2-3 seconds to trigger an emergency alert. This creates a P1 incident.
            </p>
          </div>

          {phase === "holding" && (
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-75 ease-linear"
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {holdProgress < 100 ? "Keep holding..." : "Triggering..."}
              </p>
            </div>
          )}

          <button
            disabled={phase === "triggered"}
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            className="w-32 h-32 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 select-none mx-auto cursor-pointer"
            style={{ transform: phase === "holding" ? `scale(${1 + holdProgress / 200})` : undefined }}
          >
            {panicMutation.isPending ? (
              <Loader2 className="size-10 text-white animate-spin" />
            ) : (
              <Shield className="size-10 text-white" />
            )}
          </button>

          <p className="text-[10px] text-muted-foreground">
            This triggers an immediate P1 critical incident alert
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
