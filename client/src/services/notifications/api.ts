import { http } from '@/services/http/client'
import type { Notification, Pagination } from '@/services/types'

export const notificationsApi = {
  async getAll(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const response = await http.get<{
      data: Notification[]
      unreadCount: number
      pagination: Pagination
    }>('/notifications', { params })
    return response.data
  },

  async markAsRead(id: string) {
    const response = await http.patch<Notification>(`/notifications/${id}/read`)
    return response.data
  },

  async markAllAsRead() {
    await http.patch('/notifications/read-all')
  },

  async delete(id: string) {
    await http.delete(`/notifications/${id}`)
  },

  async clear() {
    await http.delete('/notifications')
  },
}
