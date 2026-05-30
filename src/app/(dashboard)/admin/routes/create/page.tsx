"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRouteSchema, type CreateRouteInput } from "@/modules/scheduling/validators"
import { PageHeader } from "@/components/enterprise/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function CreateRoutePage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<CreateRouteInput>({
    resolver: zodResolver(createRouteSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      origin: "",
      destination: "",
      stops: [{ stopId: "", sequence: 1, arrivalMin: 0 }],
    },
  })

  const { fields, append, remove, swap } = useFieldArray({ control, name: "stops" })

  const { data: stopsData } = useQuery<{ success: true; data: any[] }>({
    queryKey: ["stops-list"],
    queryFn: () => fetch("/api/v1/scheduling/stops?limit=100").then((r) => r.json()),
  })

  async function onSubmit(data: CreateRouteInput) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/v1/scheduling/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? "Failed")
      toast.success("Route created")
      router.push("/admin/routes")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const stops = stopsData?.data ?? []

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Create Route" description="Build a new transport route with ordered stops">
        <Link href="/admin/routes">
          <Button variant="outline" size="sm"><ArrowLeft className="size-4 mr-2" />Back</Button>
        </Link>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Route Code *</Label>
                <Input id="code" placeholder="e.g., R-N2A" {...register("code")} />
                {errors.code && <p className="text-xs text-red-400">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Route Name *</Label>
                <Input id="name" placeholder="e.g., Noida Sec 37 - Anand Vihar" {...register("name")} />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input id="origin" placeholder="Starting point" {...register("origin")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input id="destination" placeholder="End point" {...register("destination")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stop Builder */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Route Stops ({fields.length})</h3>
              <Button
                type="button" variant="outline" size="sm"
                onClick={() => append({ stopId: "", sequence: fields.length + 1, arrivalMin: 0 })}
              >
                <Plus className="size-4 mr-1" /> Add Stop
              </Button>
            </div>
            {errors.stops?.message && <p className="text-xs text-red-400">{errors.stops.message}</p>}

            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Stop</TableHead>
                    <TableHead className="w-24">Arrival (min)</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="text-sm font-medium tabular-nums">{index + 1}</TableCell>
                      <TableCell>
                        <select
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                          {...register(`stops.${index}.stopId`)}
                        >
                          <option value="">Select stop...</option>
                          {stops.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20"
                          placeholder="0"
                          {...register(`stops.${index}.arrivalMin`, { valueAsNumber: true })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button" variant="ghost" size="icon" className="size-8"
                            disabled={index === 0}
                            onClick={() => swap(index, index - 1)}
                          >
                            <ChevronUp className="size-4" />
                          </Button>
                          <Button
                            type="button" variant="ghost" size="icon" className="size-8"
                            disabled={index === fields.length - 1}
                            onClick={() => swap(index, index + 1)}
                          >
                            <ChevronDown className="size-4" />
                          </Button>
                          <Button
                            type="button" variant="ghost" size="icon" className="size-8 text-red-400"
                            disabled={fields.length === 1}
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/routes"><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            Create Route
          </Button>
        </div>
      </form>
    </div>
  )
}
