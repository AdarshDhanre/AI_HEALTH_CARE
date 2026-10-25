import { createContext, useCallback, useMemo, useState } from 'react'
import i18n from '../i18n'
import * as authService from '../services/authService'

export const AuthContext = createContext(null)

const load = () => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(load)

  const store = useCallback((res) => {
    try { localStorage.setItem('token', res.token); localStorage.setItem('user', JSON.stringify(res)) } catch { /* ignore */ }
    setUser(res)
    if (res.language) { i18n.changeLanguage(res.language); try { localStorage.setItem('lang', res.language) } catch { /* ignore */ } }
    return res
  }, [])

  const login = useCallback((body) => authService.login(body).then(store), [store])
  const signup = useCallback((body) => authService.register(body).then(store), [store])
  const loginWithAadhaar = useCallback((body) => authService.aadhaarOtpLogin(body).then(store), [store])
  const logout = useCallback(() => {
    try { localStorage.removeItem('token'); localStorage.removeItem('user') } catch { /* ignore */ }
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, signup, loginWithAadhaar, logout }), [user, login, signup, loginWithAadhaar, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
