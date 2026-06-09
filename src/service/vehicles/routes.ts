import api from '../api'

export async function listRoutes(params?: any) {
    const res = await api.get('/routes', { params })
    let data = res.data?.data ?? res.data ?? []
    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
        data = data.data
    }
    return Array.isArray(data) ? data : []
}

export async function getRoute(id: string | number) {
    const res = await api.get(`/routes/${id}`)
    return res.data?.data ?? res.data
}

export async function createRoute(data: any) {
    const res = await api.post('/routes', data)
    return res.data?.data ?? res.data
}

export async function updateRoute(id: string | number, data: any) {
    const res = await api.put(`/routes/${id}`, data)
    return res.data?.data ?? res.data
}

export async function deleteRoute(id: string | number) {
    const res = await api.delete(`/routes/${id}`)
    return res.data?.data ?? res.data
}
