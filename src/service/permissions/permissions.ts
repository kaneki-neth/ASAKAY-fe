import api from '../api'

export async function listPermissions(params?: Record<string, any>) {
  const res = await api.get('/permissions', { params })
  const data = res.data?.data ?? res.data ?? []
  return Array.isArray(data) ? data : []
}

export async function getPermission(id: string | number) {
  const res = await api.get(`/permissions/${id}`)
  return res.data?.data ?? res.data
}

export async function createPermission(payload: { name: string; description?: string }) {
  const res = await api.post('/permissions', payload)
  return res.data?.data ?? res.data
}

export async function updatePermission(id: string | number, payload: { name: string; description?: string }) {
  const res = await api.put(`/permissions/${id}`, payload)
  return res.data?.data ?? res.data
}

export async function deletePermission(id: string | number) {
  const res = await api.delete(`/permissions/${id}`)
  return res.data?.data ?? res.data
}
