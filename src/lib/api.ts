const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1"

export type PageMeta = { page: number; limit: number; total: number; totalPages: number }

type ApiResult<T> = { data: T; meta?: PageMeta; message?: string }

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export async function api<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<ApiResult<T>> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      // The JWT lives in an httpOnly cookie set by the API
      credentials: "include",
      headers: { ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
      body: init.body ? JSON.stringify(init.body) : undefined,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new ApiError(0, "Cannot reach the server. Please check your connection and try again.")
  }

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const fieldErrors: Record<string, string> = {}
    for (const e of json?.errors ?? []) fieldErrors[e.path] ??= e.message
    throw new ApiError(res.status, json?.message ?? "Something went wrong", fieldErrors)
  }
  return json as ApiResult<T>
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong"
