import api from './api'
export const login = (body) => api.post('/auth/login', body).then((r) => r.data)
export const register = (body) => api.post('/auth/register', body).then((r) => r.data)
export const aadhaarOtpLogin = (body) => api.post('/auth/aadhaar-otp-login', body).then((r) => r.data)
