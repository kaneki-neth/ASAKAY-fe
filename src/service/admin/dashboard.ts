import api from '../api'

export async function getDashboardSummary() {
    const res = await api.get('/admin/dashboard')
    return res.data?.summary ?? res.data
}

export async function getRecentRouteActivity(limit = 5) {
    const res = await api.get('/admin/dashboard/recent-route-activity', { params: { limit } })
    return res.data?.data ?? res.data ?? []
}

export async function getRecentLogins(limit = 5) {
    const res = await api.get('/admin/dashboard/recent-logins', { params: { limit } })
    return res.data?.data ?? res.data ?? []
}
