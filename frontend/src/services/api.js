import axios from 'axios'

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` })

const read = () => { try { return localStorage.getItem('token') } catch { return null } }

api.interceptors.request.use((cfg) => {
  const t = read()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      try { localStorage.removeItem('token'); localStorage.removeItem('user') } catch { /* ignore */ }
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
