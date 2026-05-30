import type { UserRole } from "@/generated/prisma/enums"

export type SystemRole = UserRole

export interface AuthUser {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string | null
  role: SystemRole
  depotId: string | null
  organizationId: string
  employeeId: string | null
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type { UserRole }
