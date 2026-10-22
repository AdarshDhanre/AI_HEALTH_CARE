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

  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // Ayushman OCR state
  const [cardExtracting, setCardExtracting] = useState(false)
  const [ayushmanCard, setAyushmanCard] = useState(null)

  // Aadhaar OCR state
  const [aadhaarExtracting, setAadhaarExtracting] = useState(false)
  const [aadhaarDetails, setAadhaarDetails] = useState(null)

  const set = (k) => (e) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c

  useEffect(() => {
    if (loc.state?.ayushman) {
      const card = loc.state.ayushman
<<<<<<< HEAD
      setAyushmanCard(card)
=======

      setAyushmanCard(card)

>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
      setForm((prev) => ({
        ...prev,
        fullName: card.name || prev.fullName,
        role: 'PATIENT',
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
      }))
    }
  }, [loc.state])

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
  const handleCardUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file || !validateImage(file)) return

    setCardExtracting(true)
    setError(null)

>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
    const formData = new FormData()
    formData.append('file', file)

    try {
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

      const extracted = res.data?.extracted_fields

      if (!extracted) {
        throw new Error('No details could be extracted from this card.')
      }

      setAyushmanCard(extracted)

      setForm((prev) => ({
        ...prev,
        fullName: extracted.name || prev.fullName,
        role: 'PATIENT',
        email:
          prev.email ||
          (extracted.pmjay_id
            ? `patient_${extracted.pmjay_id
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')}@ayushman.local`
            : prev.email),
      }))
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        'Ayushman card extraction failed. Check that the OCR service is running on port 8001.'
      )
    } finally {
      setCardExtracting(false)
    }
  }

  // Aadhaar card OCR
  const handleAadhaarUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file || !validateImage(file)) return

    setAadhaarExtracting(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Currently reuses the existing OCR endpoint.
      // The backend parser must support Aadhaar formats for reliable results.
      const res = await api.post(
        '/ayushman/extract-public',
        formData,
        { timeout: 60000 }
      )

      const extracted = res.data?.extracted_fields

      if (!extracted) {
        throw new Error('No details could be extracted. Please enter your name manually.')
      }

      const details = {
        name: extracted.name || '',
        dob: extracted.dob || '',
        gender: extracted.gender || '',
      }

      setAadhaarDetails(details)

      // Only autofill the name; the user can review and edit it.
      if (details.name) {
        setForm((prev) => ({
          ...prev,
          fullName: details.name,
          role: 'PATIENT',
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
        }))
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
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
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
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
      nav('/')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="card w-full max-w-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">
            {t('auth.signup')}
          </h1>
          <LanguageSwitcher />
        </div>

        {/* Aadhaar Card OCR */}
        {form.role === 'PATIENT' && (
          <section className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3">
            <div>
              <h2 className="font-semibold text-blue-900">
                🪪 Aadhaar Card Auto-fill (Optional)
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Upload an Aadhaar image to try extracting your name,
                date of birth, and gender. Review the details before
                continuing.
              </p>
            </div>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              disabled={extracting}
              onChange={handleAadhaarUpload}
              className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-blue-600 file:px-2.5 file:py-1 file:font-semibold file:text-white hover:file:bg-blue-700"
            />

            {aadhaarExtracting && (
              <p className="text-sm text-blue-700" role="status">
                Extracting Aadhaar details...
              </p>
            )}

            {aadhaarDetails && (
              <div className="space-y-1 rounded-md border border-blue-200 bg-white p-3 text-sm">
                <p>
                  <strong>Name:</strong>{' '}
                  {aadhaarDetails.name || 'Not detected'}
                </p>
                <p>
                  <strong>Date of birth:</strong>{' '}
                  {aadhaarDetails.dob || 'Not detected'}
                </p>
                <p>
                  <strong>Gender:</strong>{' '}
                  {aadhaarDetails.gender || 'Not detected'}
                </p>

                <p className="pt-1 text-xs text-amber-700">
                  OCR may be inaccurate. Check the details manually.
                  This process does not verify Aadhaar identity.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Ayushman Card OCR */}
        {form.role === 'PATIENT' && (
          <section className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-teal-900">
                <span>🪪</span> Ayushman Card Auto-fill
              </span>

              {cardExtracting && (
                <span className="animate-pulse text-teal-700">
                  Scanning...
                </span>
              )}
            </div>

            <p className="mb-2 text-slate-600">
              Upload your Ayushman / PM-JAY card to fill in your details.
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={extracting}
              onChange={handleCardUpload}
              className="block w-full cursor-pointer text-xs file:mr-2 file:rounded file:border-0 file:bg-teal-600 file:px-2.5 file:py-1 file:font-semibold file:text-white hover:file:bg-teal-700"
            />

            {cardExtracting && (
              <p className="mt-2 text-teal-700" role="status">
                Scanning Ayushman card...
              </p>
            )}

            {ayushmanCard && (
              <div className="mt-2 space-y-0.5 rounded border border-teal-200 bg-white p-2 font-mono text-[11px] text-teal-950">
                <div>
                  <strong>Name:</strong>{' '}
                  {ayushmanCard.name || 'Not detected'}
                </div>
                <div>
                  <strong>PM-JAY ID:</strong>{' '}
                  {ayushmanCard.pmjay_id || 'Not detected'}
                </div>
                {ayushmanCard.gender && (
                  <div>
                    <strong>Gender:</strong> {ayushmanCard.gender}
                  </div>
                )}
                {ayushmanCard.dob && (
                  <div>
                    <strong>DOB:</strong> {ayushmanCard.dob}
                  </div>
                )}
              </div>
            )}
          </section>
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
        )}

        <div>
          <label className="label">{t('auth.fullName')}</label>
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
        </div>

        <div>
          <label className="label">{t('auth.email')}</label>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={set('email')}
          />
        </div>

        <div>
          <label className="label">{t('auth.password')} (min 8)</label>
          <input
            className="input"
            type="password"
            minLength={8}
            required
            value={form.password}
            onChange={set('password')}
          />
        </div>

        <div>
          <label className="label">{t('auth.role')}</label>
          <select
            className="input"
            value={form.role}
            onChange={set('role')}
          >
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
            <option value="PATIENT">{t('auth.patient')}</option>
            <option value="DOCTOR">{t('auth.doctor')}</option>
            <option value="RESEARCHER">{t('auth.researcher')}</option>
          </select>
        </div>

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
}
=======
}
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
