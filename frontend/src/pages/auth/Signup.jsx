import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { errMsg } from '../../utils/formatters'
import api from '../../services/api'

export default function Signup() {
  const { t, i18n } = useTranslation()
  const { signup } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

<<<<<<< HEAD
<<<<<<< HEAD
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'PATIENT' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cardExtracting, setCardExtracting] = useState(false)
  const [ayushmanCard, setAyushmanCard] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
=======
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'PATIENT',
  })

=======
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'PATIENT' })
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cardExtracting, setCardExtracting] = useState(false)
  const [ayushmanCard, setAyushmanCard] = useState(null)

<<<<<<< HEAD
  // Aadhaar OCR state
  const [aadhaarExtracting, setAadhaarExtracting] = useState(false)
  const [aadhaarDetails, setAadhaarDetails] = useState(null)

  const set = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)

  useEffect(() => {
    if (loc.state?.ayushman) {
      const card = loc.state.ayushman
<<<<<<< HEAD
<<<<<<< HEAD
      setAyushmanCard(card)
=======

      setAyushmanCard(card)

>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
      setAyushmanCard(card)
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
      setForm((prev) => ({
        ...prev,
        fullName: card.name || prev.fullName,
        role: 'PATIENT',
<<<<<<< HEAD
<<<<<<< HEAD
        email: prev.email || (card.pmjay_id ? `patient_${card.pmjay_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@ayushman.local` : prev.email),
=======
        email:
          prev.email ||
          (card.pmjay_id
            ? `patient_${card.pmjay_id
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')}@ayushman.local`
            : prev.email),
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
        email: prev.email || (card.pmjay_id ? `patient_${card.pmjay_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@ayushman.local` : prev.email),
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
      }))
    }
  }, [loc.state])

<<<<<<< HEAD
<<<<<<< HEAD
  const handleCardUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCardExtracting(true)
    setError(null)
=======
  // Validate uploaded identity-card image
  const validateImage = (file) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or WEBP image.')
      return false
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be 5 MB or less.')
      return false
    }

    return true
  }

  // Existing Ayushman card OCR
=======
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
  const handleCardUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCardExtracting(true)
    setError(null)
<<<<<<< HEAD

>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
    const formData = new FormData()
    formData.append('file', file)

    try {
<<<<<<< HEAD
<<<<<<< HEAD
      const res = await api.post('/ayushman/extract-public', formData)
      const extracted = res.data?.extracted_fields
      if (extracted) {
        setAyushmanCard(extracted)
        setForm((prev) => ({
          ...prev,
          fullName: extracted.name || prev.fullName,
          role: 'PATIENT',
          email: prev.email || (extracted.pmjay_id ? `patient_${extracted.pmjay_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@ayushman.local` : prev.email),
=======
      const res = await api.post(
        '/ayushman/extract-public',
        formData,
        { timeout: 60000 }
      )

=======
      const res = await api.post('/ayushman/extract-public', formData)
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
      const extracted = res.data?.extracted_fields
      if (extracted) {
        setAyushmanCard(extracted)
        setForm((prev) => ({
          ...prev,
          fullName: extracted.name || prev.fullName,
          role: 'PATIENT',
<<<<<<< HEAD
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
          email: prev.email || (extracted.pmjay_id ? `patient_${extracted.pmjay_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@ayushman.local` : prev.email),
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
        }))
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
<<<<<<< HEAD
<<<<<<< HEAD
        'Ayushman card extraction failed. Make sure the Ayushman OCR service is running on port 8001.'
      )
    } finally {
      setCardExtracting(false)
=======
        err.message ||
        'Aadhaar OCR failed. You can enter your details manually.'
      )
    } finally {
      setAadhaarExtracting(false)
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
        'Ayushman card extraction failed. Make sure the Ayushman OCR service is running on port 8001.'
      )
    } finally {
      setCardExtracting(false)
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
<<<<<<< HEAD
<<<<<<< HEAD
    try {
      await signup({ ...form, language: i18n.resolvedLanguage })
=======

    try {
      await signup({
        ...form,
        language: i18n.resolvedLanguage,
      })

>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
    try {
      await signup({ ...form, language: i18n.resolvedLanguage })
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
      nav('/')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

<<<<<<< HEAD
<<<<<<< HEAD
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">{t('auth.signup')}</h1>
          <LanguageSwitcher />
        </div>

        {form.role === 'PATIENT' && (
          <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                <span>🪪</span> Ayushman Card Auto-fill
              </span>
              {cardExtracting && <span className="animate-pulse text-teal-700">Scanning...</span>}
            </div>
            <p className="text-slate-600 mb-2">
              Upload your Ayushman / PM-JAY card image to automatically fill your details.
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={cardExtracting}
              onChange={handleCardUpload}
              className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-teal-600 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700 cursor-pointer"
            />
            {ayushmanCard && (
              <div className="mt-2 rounded bg-white p-2 border border-teal-200 text-teal-950 font-mono text-[11px] space-y-0.5">
                <div><strong>Name:</strong> {ayushmanCard.name || 'Not detected'}</div>
                <div><strong>PM-JAY ID:</strong> {ayushmanCard.pmjay_id || 'Not detected'}</div>
                {ayushmanCard.gender && <div><strong>Gender:</strong> {ayushmanCard.gender}</div>}
                {ayushmanCard.dob && <div><strong>DOB:</strong> {ayushmanCard.dob}</div>}
              </div>
            )}
          </div>
=======
  const extracting = cardExtracting || aadhaarExtracting

=======
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">{t('auth.signup')}</h1>
          <LanguageSwitcher />
        </div>

        {form.role === 'PATIENT' && (
          <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-teal-900 flex items-center gap-1.5">
                <span>🪪</span> Ayushman Card Auto-fill
              </span>
              {cardExtracting && <span className="animate-pulse text-teal-700">Scanning...</span>}
            </div>
            <p className="text-slate-600 mb-2">
              Upload your Ayushman / PM-JAY card image to automatically fill your details.
            </p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={cardExtracting}
              onChange={handleCardUpload}
              className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-teal-600 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700 cursor-pointer"
            />
            {ayushmanCard && (
              <div className="mt-2 rounded bg-white p-2 border border-teal-200 text-teal-950 font-mono text-[11px] space-y-0.5">
                <div><strong>Name:</strong> {ayushmanCard.name || 'Not detected'}</div>
                <div><strong>PM-JAY ID:</strong> {ayushmanCard.pmjay_id || 'Not detected'}</div>
                {ayushmanCard.gender && <div><strong>Gender:</strong> {ayushmanCard.gender}</div>}
                {ayushmanCard.dob && <div><strong>DOB:</strong> {ayushmanCard.dob}</div>}
              </div>
            )}
<<<<<<< HEAD
          </section>
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
          </div>
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
        )}

        <div>
          <label className="label">{t('auth.fullName')}</label>
<<<<<<< HEAD
<<<<<<< HEAD
          <input className="input" required value={form.fullName} onChange={set('fullName')} />
        </div>
        <div>
          <label className="label">{t('auth.email')}</label>
          <input className="input" type="email" required value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">{t('auth.password')} (min 8)</label>
          <input className="input" type="password" minLength={8} required value={form.password} onChange={set('password')} />
        </div>
        <div>
          <label className="label">{t('auth.role')}</label>
          <select className="input" value={form.role} onChange={set('role')}>
=======
          <input
            className="input"
            required
            value={form.fullName}
            onChange={set('fullName')}
          />
=======
          <input className="input" required value={form.fullName} onChange={set('fullName')} />
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
        </div>
        <div>
          <label className="label">{t('auth.email')}</label>
          <input className="input" type="email" required value={form.email} onChange={set('email')} />
        </div>
        <div>
          <label className="label">{t('auth.password')} (min 8)</label>
          <input className="input" type="password" minLength={8} required value={form.password} onChange={set('password')} />
        </div>
        <div>
          <label className="label">{t('auth.role')}</label>
<<<<<<< HEAD
          <select
            className="input"
            value={form.role}
            onChange={set('role')}
          >
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
          <select className="input" value={form.role} onChange={set('role')}>
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
            <option value="PATIENT">{t('auth.patient')}</option>
            <option value="DOCTOR">{t('auth.doctor')}</option>
            <option value="RESEARCHER">{t('auth.researcher')}</option>
          </select>
        </div>

<<<<<<< HEAD
<<<<<<< HEAD
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy || cardExtracting}>
          {busy ? t('common.loading') : t('auth.signup')}
        </button>
=======
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          className="btn w-full"
          disabled={busy || extracting}
        >
          {busy ? t('common.loading') : t('auth.signup')}
        </button>

>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy || cardExtracting}>
          {busy ? t('common.loading') : t('auth.signup')}
        </button>
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
        <p className="text-center text-sm">
          {t('auth.haveAccount')}{' '}
          <Link className="text-teal-700 underline" to="/login">
            {t('auth.login')}
          </Link>
        </p>
      </form>
    </div>
  )
<<<<<<< HEAD
<<<<<<< HEAD
}
=======
}
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
=======
}
>>>>>>> 9d45d5b (Integrate Aadhaar OCR and patient pre-consultation interview)
