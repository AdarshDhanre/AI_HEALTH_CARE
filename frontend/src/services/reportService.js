import api from './api'

export const uploadReport = (patientId, file, language, reportDate) => {
  const fd = new FormData()
  fd.append('patientId', patientId)
  fd.append('file', file)
  if (language) fd.append('language', language)
  if (reportDate) fd.append('reportDate', reportDate)
  return api.post('/reports/upload', fd, { timeout: 180000 }).then((r) => r.data)
}
export const listReports = (patientId) => api.get(`/patients/${patientId}/reports`).then((r) => r.data)
export const getReport = (id, language) => api.get(`/reports/${id}`, { params: { language } }).then((r) => r.data)
export const updateResult = (reportId, resultId, body) => api.put(`/reports/${reportId}/results/${resultId}`, body).then((r) => r.data)
export const confirmReport = (id) => api.post(`/reports/${id}/confirm`).then((r) => r.data)
