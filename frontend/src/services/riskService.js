import api from './api'

export const riskService = {
  predictRisk: (data) => api.post('/risk/predict', data).then((r) => r.data),
  analyzeSymptomText: (data) => api.post('/risk/analyze-symptom-text', data).then((r) => r.data),
}

export default riskService
