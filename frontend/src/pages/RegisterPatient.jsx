import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createPatient } from '../services/patientService'
import { LANGUAGES } from '../utils/constants'
import { errMsg } from '../utils/formatters'

export default function RegisterPatient() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', dob: '', gender: '', phone: '', email: '', aadhaarLast4: '', dietPref: 'VEGETARIAN', preferredLanguage: 'en' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      await createPatient({
        name: f.name,
        dob: f.dob || null,
        gender: f.gender || null,
        phone: f.phone || null,
        email: f.email || null,
        dietPref: f.dietPref,
        preferredLanguage: f.preferredLanguage,
      })
      window.alert('Patient registered successfully!')
      nav('/patients')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{t('patient.register')}</h1>
      <p className="text-sm text-slate-500">Enter patient information to register directly, or open an Aadhaar Card or Ayushman Bharat Card option if you want to use a card.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => nav('/ayushman-scanner')} className="rounded-xl border p-4 text-left hover:border-teal-500">
          <div className="text-3xl">🪪</div><div className="mt-2 font-semibold">Ayushman Bharat Card</div><div className="text-xs text-slate-500">Open card scanner</div>
        </button>
        <button type="button" onClick={() => nav('/aadhaar-scanner')} className="rounded-xl border p-4 text-left hover:border-teal-500">
          <div className="text-3xl">🗂️</div><div className="mt-2 font-semibold">Aadhaar Card</div><div className="text-xs text-slate-500">Open Aadhaar card screen</div>
        </button>
      </div>
      <div><label className="label">{t('common.name')}</label><input className="input" required value={f.name} onChange={set('name')} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">{t('patient.dob')}</label><input className="input" type="date" value={f.dob} onChange={set('dob')} /></div>
        <div><label className="label">{t('patient.gender')}</label><select className="input" value={f.gender} onChange={set('gender')}><option value="">-</option><option>Male</option><option>Female</option><option>Other</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">{t('patient.diet')}</label><select className="input" value={f.dietPref} onChange={set('dietPref')}><option value="VEGETARIAN">{t('patient.veg')}</option><option value="NON_VEGETARIAN">{t('patient.nonveg')}</option><option value="VEGAN">{t('patient.vegan')}</option></select></div>
        <div><label className="label">{t('patient.language')}</label><select className="input" value={f.preferredLanguage} onChange={set('preferredLanguage')}>{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2"><button className="btn" disabled={busy}>{busy ? 'Please wait…' : 'Register Patient'}</button><button type="button" className="btn-outline" onClick={() => nav('/patients')}>{t('common.cancel')}</button></div>
    </form>
  )
}
