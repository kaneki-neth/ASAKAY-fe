import axios from 'axios'
import { emitError, emitUnauth } from './toast'

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use(config => {
	const token = localStorage.getItem('token')
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

api.interceptors.response.use(
	response => response,
	error => {
		const status = error?.response?.status
		const data = error?.response?.data
		let message =
			(data && (data.message || data.error || data.detail)) ||
			error?.response?.statusText ||
			error?.message ||
			'Unexpected error'

		if (status === 422) {
			const errs = data?.errors
			if (errs && typeof errs === 'object') {
				const list = Object.values(errs).flat().filter(Boolean)
				if (list.length) {
					message = list.join(' | ')
				}
			}
		}

		emitError(message)

		if (status === 401) {
			localStorage.removeItem('token')
			emitUnauth()
		}
		return Promise.reject(error)
	},
)

export default api
