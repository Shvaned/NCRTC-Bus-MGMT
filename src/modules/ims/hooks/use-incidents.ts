"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { IncidentDetail, IncidentStats } from "../types"

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const json = await res.json()
  if (!res.ok || !json.success) throw new Error(json?.error?.message ?? "Request failed")
  return json as T
}

export function useIncidents(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") sp.set(k, String(v)) })

  return useQuery<{ success: true; data: any[]; pagination: any }>({
    queryKey: ["incidents", params],
    queryFn: () => fetchJSON(`/api/v1/ims/incidents?${sp}`),
  })
}

export function useIncidentDetail(id: string | null) {
  return useQuery<{ success: true; data: IncidentDetail }>({
    queryKey: ["incident", id],
    queryFn: () => fetchJSON(`/api/v1/ims/incidents/${id}`),
    enabled: !!id,
  })
}

export function useCreateIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJSON("/api/v1/ims/incidents", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Incident created") },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function usePanic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data?: Record<string, unknown>) =>
      fetchJSON("/api/v1/ims/panic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Panic alert sent") },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useAssignIncident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; assignedToId: string; notes?: string }) =>
      fetchJSON(`/api/v1/ims/incidents/${id}/assign`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Incident assigned") },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useTransitionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; note: string }) =>
      fetchJSON(`/api/v1/ims/incidents/${id}/status`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Status updated") },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useAddNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      fetchJSON(`/api/v1/ims/incidents/${id}/note`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); toast.success("Note added") },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useIncidentStats(depotId?: string) {
  const sp = new URLSearchParams()
  if (depotId) sp.set("depotId", depotId)

  return useQuery<{ success: true; data: IncidentStats }>({
    queryKey: ["incident-stats", depotId],
    queryFn: () => fetchJSON(`/api/v1/ims/stats?${sp}`),
    refetchInterval: 30000,
  })
}
