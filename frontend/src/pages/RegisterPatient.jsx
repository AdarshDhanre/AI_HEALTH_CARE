import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createPatient } from '../services/patientService'
import { LANGUAGES } from '../utils/constants'
import { errMsg } from '../utils/formatters'

export default function RegisterPatient() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', dob: '', gender: '', phone: '', dietPref: 'VEGETARIAN', preferredLanguage: 'en' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      await createPatient({ ...f, dob: f.dob || null, gender: f.gender || null, phone: f.phone || null })
      nav('/patients')
    } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">{t('patient.register')}</h1>
      <div><label className="label">{t('common.name')}</label><input className="input" required value={f.name} onChange={set('name')} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">{t('patient.dob')}</label><input className="input" type="date" value={f.dob} onChange={set('dob')} /></div>
        <div><label className="label">{t('patient.gender')}</label>
          <select className="input" value={f.gender} onChange={set('gender')}><option value="">-</option><option>Male</option><option>Female</option><option>Other</option></select></div>
      </div>
      <div><label className="label">{t('patient.phone')}</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">{t('patient.diet')}</label>
          <select className="input" value={f.dietPref} onChange={set('dietPref')}>
            <option value="VEGETARIAN">{t('patient.veg')}</option><option value="NON_VEGETARIAN">{t('patient.nonveg')}</option><option value="VEGAN">{t('patient.vegan')}</option>
          </select></div>
        <div><label className="label">{t('patient.language')}</label>
          <select className="input" value={f.preferredLanguage} onChange={set('preferredLanguage')}>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select></div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2"><button className="btn" disabled={busy}>{t('common.save')}</button>
        <button type="button" className="btn-outline" onClick={() => nav('/patients')}>{t('common.cancel')}</button></div>
    </form>
  )
}
