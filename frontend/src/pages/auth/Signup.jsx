import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { errMsg } from '../../utils/formatters'

export default function Signup() {
  const { t, i18n } = useTranslation()
  const { signup } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'PATIENT' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try { await signup({ ...form, language: i18n.resolvedLanguage }); nav('/') } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">{t('auth.signup')}</h1><LanguageSwitcher />
        </div>
        <div><label className="label">{t('auth.fullName')}</label><input className="input" required value={form.fullName} onChange={set('fullName')} /></div>
        <div><label className="label">{t('auth.email')}</label><input className="input" type="email" required value={form.email} onChange={set('email')} /></div>
        <div><label className="label">{t('auth.password')} (min 8)</label><input className="input" type="password" minLength={8} required value={form.password} onChange={set('password')} /></div>
        <div><label className="label">{t('auth.role')}</label>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="PATIENT">{t('auth.patient')}</option>
            <option value="DOCTOR">{t('auth.doctor')}</option>
            <option value="RESEARCHER">{t('auth.researcher')}</option>
          </select></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy}>{t('auth.signup')}</button>
        <p className="text-center text-sm">{t('auth.haveAccount')} <Link className="text-teal-700 underline" to="/login">{t('auth.login')}</Link></p>
      </form>
    </div>
  )
}
