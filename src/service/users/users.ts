import api from '../api'

export async function listUsers(params?: Record<string, any>) {
	const res = await api.get('/users', { params })
	const data = res.data?.data ?? res.data ?? []
	return Array.isArray(data) ? data : []
}

export async function getUser(id: string | number) {
	const res = await api.get(`/users/${id}`)
	return res.data?.data ?? res.data
}

export async function createUser(payload: { name: string; email: string }) {
	const res = await api.post('/users', payload)
	return res.data?.data ?? res.data
}

export async function updateUser(
	id: string | number,
	payload: { name?: string; email?: string },
) {
	const res = await api.put(`/users/${id}`, payload)
	return res.data?.data ?? res.data
}

export async function deleteUser(id: string | number) {
	const res = await api.delete(`/users/${id}`)
	return res.data?.data ?? res.data
}

export async function assignRoleToUser(userId: string | number, roleId: string | number) {
	const res = await api.post(`/users/${userId}/roles`, { role_id: roleId })
	return res.data?.data ?? res.data
}

export async function removeRoleFromUser(userId: string | number, roleId: string | number) {
	const res = await api.delete(`/users/${userId}/roles/${roleId}`)
	return res.data?.data ?? res.data
}
