import { http } from '@/services/http/client'
import type { Hotspot, HotspotQuery, Stats } from '@/services/types'

export const hotspotsApi = {
  async getAll(params?: HotspotQuery) {
    const response = await http.get<{
      data: Hotspot[]
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>('/hotspots', { params })
    return response.data
  },

  async getStats() {
    const response = await http.get<Stats>('/hotspots/stats')
    return response.data
  },

  async getById(id: string) {
    const response = await http.get<Hotspot>(`/hotspots/${id}`)
    return response.data
  },

  async search(query: string, sources?: string[]) {
    const response = await http.post<{ results: Hotspot[] }>('/hotspots/search', {
      query,
      sources,
    })
    return response.data
  },

  async delete(id: string) {
    await http.delete(`/hotspots/${id}`)
  },
}
