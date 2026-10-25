import api from './api'

export const riskService = {
  predictRisk: (data) => api.post('/risk/predict', data).then((r) => r.data),
  analyzeSymptomText: (data) => api.post('/risk/analyze-symptom-text', data).then((r) => r.data),
  getTtsAudio: (text, lang) =>
    api.get('/tts', {
      params: { text, lang },
      responseType: 'blob',
    }).then((r) => r.data),
}

export default riskService
