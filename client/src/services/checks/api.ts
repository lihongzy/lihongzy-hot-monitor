import { http } from '@/services/http/client'

export async function triggerHotspotCheck() {
  const response = await http.post<{ message: string }>('/check-hotspots')
  return response.data
}
