import { http } from '@/services/http/client'

export const settingsApi = {
  async getAll() {
    const response = await http.get<Record<string, string>>('/settings')
    return response.data
  },

  async update(settings: Record<string, string>) {
    await http.put('/settings', settings)
  },
}
