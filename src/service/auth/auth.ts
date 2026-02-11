import api from '../api'

let sessionTimeout: ReturnType<typeof setTimeout> | undefined

function decodeToken(token: string) {
	try {
		const base64Url = token.split('.')[1]
		if (!base64Url) return null

		let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
		const pad = base64.length % 4
		if (pad) {
			base64 += new Array(5 - pad).join('=')
		}
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split('')
				.map(function (c) {
					return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
				})
				.join(''),
		)
		return JSON.parse(jsonPayload)
	} catch (e) {
		return null
	}
}

export function startSessionTimer() {
	const token = localStorage.getItem('token')
	if (!token) return

	const decoded = decodeToken(token)
	if (!decoded || !decoded.exp) return

	const expirationTime = decoded.exp * 1000
	const currentTime = Date.now()
	const timeLeft = expirationTime - currentTime

	stopSessionTimer()

	if (timeLeft <= 0) {
		logoutAndRedirect()
	} else {
		sessionTimeout = setTimeout(() => {
			logoutAndRedirect()
		}, timeLeft)
	}
}

export function stopSessionTimer() {
	if (sessionTimeout) {
		clearTimeout(sessionTimeout)
		sessionTimeout = undefined
	}
}

function logoutAndRedirect() {
	logout()
	window.location.href = '/login'
}

export async function login(credentials: { email: string; password: string }) {
	const res = await api.post('/login', credentials)
	const token =
		res?.data?.data?.access_token ??
		res?.data?.access_token ??
		(res as any)?.access_token ??
		(res as any)?.token
	if (token) {
		localStorage.setItem('token', token)
	}
	startSessionTimer()
	return res.data
}

export function logout() {
	stopSessionTimer()
	localStorage.removeItem('token')
	return api.post('/logout')
}

export async function getProfile() {
	const res = await api.get('/me')
	return res.data
}

export function isAuthenticated() {
	return !!localStorage.getItem('token')
}
