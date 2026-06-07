import api from '../api'

export async function listVehicles(params?: any) {
	const res = await api.get('/vehicles', { params })
	let data = res.data?.data ?? res.data ?? []

	// If it's a pagination object (Laravel standard), extract the actual data array
	if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
		data = data.data
	}

	return Array.isArray(data) ? data : []
}

export async function getVehicle(id: string | number) {
	const res = await api.get(`/vehicles/${id}`)
	return res.data?.data ?? res.data
}

export async function createVehicle(data: any) {
	const res = await api.post('/vehicles', data)
	return res.data?.data ?? res.data
}

export async function updateVehicle(id: string | number, data: any) {
	const res = await api.put(`/vehicles/${id}`, data)
	return res.data?.data ?? res.data
}

export async function deleteVehicle(id: string | number) {
	const res = await api.delete(`/vehicles/${id}`)
	return res.data?.data ?? res.data
}

export async function getVehicleTypeOptions() {
	const res = await api.get('/vehicle-types/options')
	return res.data?.data ?? res.data
}

export async function listVehicleTypes(params?: any) {
    const res = await api.get('/vehicle-types', { params })
    let data = res.data?.data ?? res.data ?? []

    if (data && typeof data === 'object' && !Array.isArray(data) && Array.isArray(data.data)) {
        data = data.data
    }

    return Array.isArray(data) ? data : []
}

export async function createVehicleType(data: any) {
    const res = await api.post('/vehicle-types', data)
    return res.data?.data ?? res.data
}

export async function updateVehicleType(id: string | number, data: any) {
    const res = await api.put(`/vehicle-types/${id}`, data)
    return res.data?.data ?? res.data
}

export async function deleteVehicleType(id: string | number) {
    const res = await api.delete(`/vehicle-types/${id}`)
    return res.data?.data ?? res.data
}

