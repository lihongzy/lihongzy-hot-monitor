import { http } from '@/services/http/client'
import type { Keyword } from '@/services/types'

export const keywordsApi = {
  async getAll() {
    const response = await http.get<Keyword[]>('/keywords')
    return response.data
  },

  async getById(id: string) {
    const response = await http.get<Keyword>(`/keywords/${id}`)
    return response.data
  },

  async create(data: { text: string; category?: string }) {
    const response = await http.post<Keyword>('/keywords', data)
    return response.data
  },

  async update(id: string, data: Partial<Keyword>) {
    const response = await http.put<Keyword>(`/keywords/${id}`, data)
    return response.data
  },

  async delete(id: string) {
    await http.delete(`/keywords/${id}`)
  },

  async toggle(id: string) {
    const response = await http.patch<Keyword>(`/keywords/${id}/toggle`)
    return response.data
  },
}
