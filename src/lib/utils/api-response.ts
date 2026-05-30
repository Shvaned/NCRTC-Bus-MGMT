export type ApiResponse<T = unknown> = {
  success: true
  data: T
  message: string
} | {
  success: false
  error: {
    code: string
    message: string
  }
}

export function successResponse<T>(data: T, message = "OK"): ApiResponse<T> {
  return { success: true, data, message }
}

export function errorResponse(code: string, message: string): ApiResponse<never> {
  return { success: false, error: { code, message } }
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true as const,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
