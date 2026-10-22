import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { errMsg } from '../../utils/formatters'
import api from '../../services/api'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const nav = useNavigate()

  const [activeTab, setActiveTab] = useState('email') 
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const [cardFile, setCardFile] = useState(null)
  const [cardBusy, setCardBusy] = useState(false)
  const [cardResult, setCardResult] = useState(null)
  const [cardPassword, setCardPassword] = useState('')

  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [aadhaarPassword, setAadhaarPassword] = useState('')

  const submitEmail = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(form)
      nav('/')
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const handleCardFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCardFile(file)
    setCardBusy(true)
    setError(null)
    setCardResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/ayushman/extract-public', formData)
      const extracted = res.data?.extracted_fields
      if (extracted) {
        setCardResult(extracted)
        // If a PM-JAY ID was found, suggest the standard email pattern or patient email
        if (extracted.pmjay_id) {
          const suggestedEmail = `patient_${extracted.pmjay_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@ayushman.local`
          setForm((prev) => ({ ...prev, email: prev.email || suggestedEmail }))
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Card OCR failed. Make sure the Ayushman OCR service is running on port 8001.'
      )
    } finally {
      setCardBusy(false)
    }
  }

  const submitCardLogin = async (e) => {
    e.preventDefault()
    if (!cardResult) {
      setError('Please select and scan your Ayushman card first.')
      return
    }

    setBusy(true)
    setError(null)

    const loginEmail = form.email || (cardResult.pmjay_id
      ? `patient_${cardResult.pmjay_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@ayushman.local`
      : '')

    try {
      await login({ email: loginEmail, password: cardPassword })
      nav('/')
    } catch (err) {
      setError('Authentication failed. If this is your first time using this card, please sign up first.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-teal-700">🩺 {t('app')}</h1>
          <LanguageSwitcher />
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('email'); setError(null) }}
            className={`rounded-md py-1.5 transition ${
              activeTab === 'email'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('ayushman'); setError(null) }}
            className={`rounded-md py-1.5 flex items-center justify-center gap-1 transition ${
              activeTab === 'ayushman'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🪪</span> Ayushman Card
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('aadhaar'); setError(null) }}
            className={`rounded-md py-1.5 flex items-center justify-center gap-1 transition ${
              activeTab === 'aadhaar'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🪪</span> Aadhaar Card
          </button>
        </div>

        {/* Standard Email Login */}
        {activeTab === 'email' && (
          <form onSubmit={submitEmail} className="space-y-4">
            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input
                className="input"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button className="btn w-full" disabled={busy}>
              {busy ? t('common.loading') : t('auth.login')}
            </button>
          </form>
        )}

        {/* Ayushman Card Login */}
        {activeTab === 'ayushman' && (
          <form onSubmit={submitCardLogin} className="space-y-4">
            <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs">
              <span className="font-semibold text-teal-900 flex items-center gap-1 mb-1">
                <span>🪪</span> Patient Card Identification
              </span>
              <p className="text-slate-600 mb-2">
                Upload your Ayushman Bharat / PM-JAY card to authenticate.
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={cardBusy}
                onChange={handleCardFileChange}
                className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-teal-600 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700 cursor-pointer"
              />
            </div>

            {cardBusy && (
              <div className="text-center py-2 text-xs text-teal-700 animate-pulse font-medium">
                Scanning Ayushman card via AI OCR model...
              </div>
            )}

            {cardResult && (
              <div className="rounded-lg border border-teal-200 bg-emerald-50/60 p-2.5 text-xs space-y-1">
                <div className="font-semibold text-emerald-800 flex items-center gap-1">
                  <span>✓</span> Card Details Verified
                </div>
                <div className="text-slate-700"><strong>Name:</strong> {cardResult.name || 'Not detected'}</div>
                <div className="text-slate-700"><strong>PM-JAY ID:</strong> {cardResult.pmjay_id || 'Not detected'}</div>
              </div>
            )}

            <div>
              <label className="label">Registered Email or Suggested ID</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                placeholder="patient@example.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <input
                className="input"
                type="password"
                required
                placeholder="Enter your account password"
                value={cardPassword}
                onChange={(e) => setCardPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button className="btn w-full" disabled={busy || cardBusy || !cardResult}>
              {busy ? t('common.loading') : 'Login with Ayushman Card'}
            </button>

            {cardResult && (
              <div className="pt-1 text-center">
                <Link
                  to="/signup"
                  state={{ ayushman: cardResult }}
                  className="text-xs text-teal-700 hover:underline font-medium"
                >
                  New Patient? Sign up using this card →
                </Link>
              </div>
            )}
          </form>
        )}

        {/* Aadhaar Card Login */}
        {activeTab === 'aadhaar' && (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!aadhaarFile) {
                setError('Please select your Aadhaar card image first.')
                return
              }
              setBusy(true)
              setError(null)
              try {
                // Aadhaar card is used as an identification aid; account credentials are still verified by the existing login API.
                await login({ email: form.email, password: aadhaarPassword })
                nav('/')
              } catch (err) {
                setError(errMsg(err))
              } finally {
                setBusy(false)
              }
            }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-teal-200 bg-teal-50/70 p-3 text-xs">
              <span className="mb-1 flex items-center gap-1 font-semibold text-teal-900">🪪 Aadhaar Card Identification</span>
              <p className="mb-2 text-slate-600">Select an Aadhaar card image, then sign in with the email and password linked to your MediCase-AI account.</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                required
                onChange={(e) => { setAadhaarFile(e.target.files?.[0] || null); setError(null) }}
                className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-teal-600 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700 cursor-pointer"
              />
              {aadhaarFile && <p className="mt-2 break-all text-slate-600">Selected: {aadhaarFile.name}</p>}
            </div>
            <div>
              <label className="label">Registered Email</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="patient@example.com" />
            </div>
            <div>
              <label className="label">Account Password</label>
              <input className="input" type="password" required value={aadhaarPassword} onChange={(e) => setAadhaarPassword(e.target.value)} placeholder="Enter your account password" />
            </div>
            <p className="text-xs text-slate-500">Aadhaar image selection does not verify identity with UIDAI. Secure Aadhaar verification must be integrated separately.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn w-full" disabled={busy || !aadhaarFile}>{busy ? t('common.loading') : 'Continue with Aadhaar Card'}</button>
          </form>
        )}

        <p className="text-center text-sm">
          {t('auth.noAccount')}{' '}
          <Link className="text-teal-700 underline" to="/signup">
            {t('auth.signup')}
          </Link>
        </p>
      </div>
    </div>
  )
}
