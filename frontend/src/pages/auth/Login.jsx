import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { errMsg } from '../../utils/formatters'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try { await login(form); nav('/') } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">🩺 {t('app')}</h1><LanguageSwitcher />
        </div>
        <div><label className="label">{t('auth.email')}</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><label className="label">{t('auth.password')}</label>
          <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy}>{t('auth.login')}</button>
        <p className="text-center text-sm">{t('auth.noAccount')} <Link className="text-teal-700 underline" to="/signup">{t('auth.signup')}</Link></p>
      </form>
    </div>
  )
}
