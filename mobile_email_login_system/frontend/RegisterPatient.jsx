import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createPatient } from '../services/patientService'
import { sendOtp, verifyOtp } from '../services/verificationService'
import { LANGUAGES } from '../utils/constants'
import { errMsg } from '../utils/formatters'

export default function RegisterPatient() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', dob: '', gender: '', phone: '', email: '', aadhaarLast4: '', dietPref: 'VEGETARIAN', preferredLanguage: 'en' })
  const [channel, setChannel] = useState('mobile')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value })
    if (k === 'phone' || k === 'email') { setVerified(false); setOtpSent(false); setCode('') }
  }
  const destination = channel === 'mobile' ? f.phone : f.email

  const requestOtp = async () => {
    setBusy(true); setError(null); setNotice(null)
    try {
      const r = await sendOtp(channel, destination)
      setOtpSent(true); setNotice(r.message)
    } catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }
  const checkOtp = async () => {
    setBusy(true); setError(null); setNotice(null)
    try {
      const r = await verifyOtp(channel, destination, code)
      if (!r.verified) throw new Error(r.message || 'Invalid or expired OTP')
      setVerified(true); setNotice('Contact verified successfully.')
    } catch (e) { setError(errMsg(e)) } finally { setBusy(false) }
  }
  const submit = async (e) => {
    e.preventDefault()
    if (!verified) { setError('Please verify your mobile number or email with OTP before registering.'); return }
    setBusy(true); setError(null)
    try {
      await createPatient({ name: f.name, dob: f.dob || null, gender: f.gender || null, phone: f.phone || null, email: f.email || null, dietPref: f.dietPref, preferredLanguage: f.preferredLanguage })
      window.alert('Patient registered successfully!')
      nav('/patients')
    } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{t('patient.register')}</h1>
      <p className="text-sm text-slate-500">Choose a patient identity folder, then verify a contact method before creating the patient record.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => nav('/ayushman-scanner')} className="rounded-xl border p-4 text-left hover:border-teal-500">
          <div className="text-3xl">🪪</div><div className="mt-2 font-semibold">Ayushman Bharat</div><div className="text-xs text-slate-500">Existing card scanner</div>
        </button>
        <button type="button" onClick={() => document.getElementById('aadhaar-section')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl border p-4 text-left hover:border-teal-500">
          <div className="text-3xl">🗂️</div><div className="mt-2 font-semibold">Aadhaar Card</div><div className="text-xs text-slate-500">Optional masked reference</div>
        </button>
        <button type="button" onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl border p-4 text-left hover:border-teal-500">
          <div className="text-3xl">📱</div><div className="mt-2 font-semibold">Mobile / Email</div><div className="text-xs text-slate-500">OTP verification</div>
        </button>
      </div>
      <div><label className="label">{t('common.name')}</label><input className="input" required value={f.name} onChange={set('name')} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">{t('patient.dob')}</label><input className="input" type="date" value={f.dob} onChange={set('dob')} /></div>
        <div><label className="label">{t('patient.gender')}</label><select className="input" value={f.gender} onChange={set('gender')}><option value="">-</option><option>Male</option><option>Female</option><option>Other</option></select></div>
      </div>
      <section id="aadhaar-section" className="rounded-xl border border-dashed p-4 space-y-2">
        <h2 className="font-semibold">🗂️ Aadhaar Card Folder (optional)</h2>
        <label className="label">Last 4 digits only</label>
        <input className="input max-w-xs" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" placeholder="XXXX" value={f.aadhaarLast4} onChange={set('aadhaarLast4')} />
        <p className="text-xs text-slate-500">For privacy, do not enter the full Aadhaar number. This reference is not sent to the backend or independently verified against UIDAI.</p>
      </section>
      <section id="contact-section" className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">📱 Mobile Number / Email Folder</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" checked={channel === 'mobile'} onChange={() => { setChannel('mobile'); setOtpSent(false); setVerified(false); setCode('') }} /> Mobile number</label>
          <label className="flex items-center gap-2"><input type="radio" checked={channel === 'email'} onChange={() => { setChannel('email'); setOtpSent(false); setVerified(false); setCode('') }} /> Email address</label>
        </div>
        {channel === 'mobile'
          ? <div><label className="label">Mobile number</label><input className="input" required value={f.phone} onChange={set('phone')} placeholder="10-digit number (or include country code)" /></div>
          : <div><label className="label">Email address</label><input className="input" type="email" required value={f.email} onChange={set('email')} placeholder="patient@example.com" /></div>}
        {!verified && <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" disabled={busy || !destination.trim()} onClick={requestOtp}>{busy ? 'Please wait…' : otpSent ? 'Resend OTP' : 'Send OTP'}</button>
          {otpSent && <><input className="input max-w-36" aria-label="OTP" inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /><button type="button" className="btn" disabled={busy || code.length !== 6} onClick={checkOtp}>Verify OTP</button></>}
        </div>}
        {verified && <p className="text-sm font-medium text-green-700">✓ {channel === 'email' ? 'Email' : 'Mobile number'} verified</p>}
        {notice && <p className="text-sm text-teal-700">{notice}</p>}
      </section>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">{t('patient.diet')}</label><select className="input" value={f.dietPref} onChange={set('dietPref')}><option value="VEGETARIAN">{t('patient.veg')}</option><option value="NON_VEGETARIAN">{t('patient.nonveg')}</option><option value="VEGAN">{t('patient.vegan')}</option></select></div>
        <div><label className="label">{t('patient.language')}</label><select className="input" value={f.preferredLanguage} onChange={set('preferredLanguage')}>{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2"><button className="btn" disabled={busy || !verified}>{busy ? 'Please wait…' : 'Register Patient'}</button><button type="button" className="btn-outline" onClick={() => nav('/patients')}>{t('common.cancel')}</button></div>
    </form>
  )
}
