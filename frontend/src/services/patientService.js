import api from './api'
export const listPatients = () => api.get('/patients').then((r) => r.data)
export const getPatient = (id) => api.get(`/patients/${id}`).then((r) => r.data)
export const createPatient = (body) => api.post('/patients', body).then((r) => r.data)
export const getTests = (id) => api.get(`/patients/${id}/tests`).then((r) => r.data)
export const getTrend = (id, test) => api.get(`/patients/${id}/trends`, { params: { test } }).then((r) => r.data)
export const getCompare = (id) => api.get(`/patients/${id}/compare`).then((r) => r.data)
export const getDashboard = (id) => api.get(`/patients/${id}/dashboard`).then((r) => r.data)
