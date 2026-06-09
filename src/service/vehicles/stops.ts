import api from '../api'

export async function listStops(params?: any) {
    const res = await api.get('/stops', { params })
    let data = res.data?.data ?? res.data ?? []
    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
        data = data.data
    }
    return Array.isArray(data) ? data : []
}

export async function getAllStops() {
    const res = await api.get('/stops/all')
    return res.data?.data ?? res.data ?? []
}

export async function getStop(id: string | number) {
    const res = await api.get(`/stops/${id}`)
    return res.data?.data ?? res.data
}

export async function createStop(data: any) {
    const res = await api.post('/stops', data)
    return res.data?.data ?? res.data
}

export async function updateStop(id: string | number, data: any) {
    const res = await api.put(`/stops/${id}`, data)
    return res.data?.data ?? res.data
}

export async function deleteStop(id: string | number) {
    const res = await api.delete(`/stops/${id}`)
    return res.data?.data ?? res.data
}
