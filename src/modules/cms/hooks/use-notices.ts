"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { NoticeDetail, NoticeListResponse } from "../types"

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message ?? "Request failed")
  }
  return json as T
}

// ── Admin hooks ──

export function useNotices(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") searchParams.set(k, String(v))
  })

  return useQuery<NoticeListResponse>({
    queryKey: ["notices", params],
    queryFn: () => fetchJSON(`/api/v1/cms/notices?${searchParams.toString()}`),
  })
}

export function useNoticeDetail(id: string | null) {
  return useQuery<{ success: true; data: NoticeDetail }>({
    queryKey: ["notice", id],
    queryFn: () => fetchJSON(`/api/v1/cms/notices/${id}`),
    enabled: !!id,
  })
}

export function useCreateNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJSON("/api/v1/cms/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] })
      toast.success("Notice created")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateNotice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchJSON(`/api/v1/cms/notices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] })
      qc.invalidateQueries({ queryKey: ["notice", id] })
      toast.success("Notice updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function usePublishNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/v1/cms/notices/${id}/publish`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] })
      toast.success("Notice published")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useArchiveNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/v1/cms/notices/${id}/archive`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] })
      toast.success("Notice archived")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useReadReceipts(id: string | null) {
  return useQuery<{ success: true; data: unknown[] }>({
    queryKey: ["read-receipts", id],
    queryFn: () => fetchJSON(`/api/v1/cms/notices/${id}/read-receipts`),
    enabled: !!id,
  })
}

// ── Driver hooks ──

export function useMyNotices(params: { page?: number; limit?: number } = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))

  return useQuery<NoticeListResponse>({
    queryKey: ["my-notices", params],
    queryFn: () => fetchJSON(`/api/v1/cms/my-notices?${searchParams.toString()}`),
    refetchInterval: 30_000,
  })
}

export function useUnreadCount() {
  return useQuery<{ success: true; data: { count: number } }>({
    queryKey: ["unread-count"],
    queryFn: () => fetchJSON("/api/v1/cms/unread-count"),
    refetchInterval: 30_000,
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noticeId: string) =>
      fetchJSON(`/api/v1/cms/notices/${noticeId}/read`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-notices"] })
      qc.invalidateQueries({ queryKey: ["unread-count"] })
    },
  })
}

export function useAcknowledgeNotice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noticeId: string) =>
      fetchJSON(`/api/v1/cms/notices/${noticeId}/acknowledge`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-notices"] })
      qc.invalidateQueries({ queryKey: ["unread-count"] })
      toast.success("Notice acknowledged")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
