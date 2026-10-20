import api from './api'
export const createCase = (patientId, body) => api.post(`/patients/${patientId}/cases`, body).then((r) => r.data)
export const listCases = (patientId) => api.get(`/patients/${patientId}/cases`).then((r) => r.data)
