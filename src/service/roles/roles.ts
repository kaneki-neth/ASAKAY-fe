import api from '../api'

export async function listRoles(params?: Record<string, any>) {
	const res = await api.get('/roles', {
		params: { ...(params || {}), include: 'permissions' },
	})
	const data = res.data?.data ?? res.data ?? []
	return Array.isArray(data) ? data : []
}

export async function getRole(id: string | number) {
	const res = await api.get(`/roles/${id}`, {
		params: { include: 'permissions' },
	})
	return res.data?.data ?? res.data
}

export async function createRole(payload: {
	name: string
	description?: string
}) {
	const res = await api.post('/roles', payload)
	return res.data?.data ?? res.data
}

export async function updateRole(
	id: string | number,
	payload: { name: string; description?: string },
) {
	const res = await api.put(`/roles/${id}`, payload)
	return res.data?.data ?? res.data
}

export async function deleteRole(id: string | number) {
	const res = await api.delete(`/roles/${id}`)
	return res.data?.data ?? res.data
}

export async function assignPermissionToRole(
	roleId: string | number,
	permissionId: string | number,
) {
	const res = await api.post(`/roles/${roleId}/permissions`, {
		permission_id: permissionId,
	})
	return res.data?.data ?? res.data
}

export async function removePermissionFromRole(
	roleId: string | number,
	permissionId: string | number,
) {
	const res = await api.delete(`/roles/${roleId}/permissions`, {
		data: { permission_id: permissionId },
	})
	return res.data?.data ?? res.data
}
