"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCreateIncident } from "@/modules/ims/hooks/use-incidents"
import { PageHeader } from "@/components/enterprise/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewIncidentPage() {
  const router = useRouter()
  const createMutation = useCreateIncident()

  const [type, setType] = useState("OTHER")
  const [severity, setSeverity] = useState("P2")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !description) {
      toast.error("Title and description are required")
      return
    }

    // Get current position from browser
    let latitude: number | null = null
    let longitude: number | null = null
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        )
        latitude = pos.coords.latitude
        longitude = pos.coords.longitude
      } catch { /* location not available */ }
    }

    createMutation.mutate(
      { type, severity, title, description, latitude, longitude },
      { onSuccess: () => router.push("/driver/incidents") }
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <PageHeader title="Report Incident" description="File a new incident report">
        <Link href="/driver/incidents">
          <Button variant="outline" size="sm"><ArrowLeft className="size-4 mr-2" />Back</Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: "BREAKDOWN", label: "Breakdown" },
                  { value: "ACCIDENT", label: "Accident" },
                  { value: "COMPLAINT", label: "Complaint" },
                  { value: "OTHER", label: "Other" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors ${type === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                    <input type="radio" value={opt.value} className="sr-only" checked={type === opt.value} onChange={() => setType(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <div className="flex gap-2">
                {[
                  { value: "P1", label: "P1", desc: "Critical" },
                  { value: "P2", label: "P2", desc: "Major" },
                  { value: "P3", label: "P3", desc: "Minor" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex-1 text-center rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${severity === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                    <input type="radio" value={opt.value} className="sr-only" checked={severity === opt.value} onChange={() => setSeverity(opt.value)} />
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Brief incident description..." value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description *</Label>
              <textarea id="desc" rows={5} placeholder="Detailed incident description..."
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                value={description} onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={createMutation.isPending}>
          {createMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          Submit Incident
        </Button>
      </form>
    </div>
  )
}
