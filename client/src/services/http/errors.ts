import axios from 'axios'

export class ApiError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function toApiError(error: unknown): ApiError {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error
      ? new ApiError(error.message)
      : new ApiError('请求失败，请稍后重试')
  }

  const message = error.response?.data?.error || error.response?.data?.message || error.message
  return new ApiError(message || '请求失败，请稍后重试', error.response?.status, error.code)
}
