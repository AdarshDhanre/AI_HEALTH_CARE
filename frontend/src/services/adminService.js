import api from './api'
export const listUsers = () => api.get('/admin/users').then((r) => r.data)
export const setUserActive = (id, value) => api.put(`/admin/users/${id}/active`, null, { params: { value } }).then((r) => r.data)
export const getAnalytics = () => api.get('/research/analytics').then((r) => r.data)
