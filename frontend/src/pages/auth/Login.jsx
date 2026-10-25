import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import { errMsg } from '../../utils/formatters'
import api from '../../services/api'

export default function Login() {
  const { t } = useTranslation()
  const { login, loginWithAadhaar } = useAuth()
  const nav = useNavigate()

  const [activeTab, setActiveTab] = useState('email') 
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const [cardFile, setCardFile] = useState(null)
  const [cardBusy, setCardBusy] = useState(false)
  const [cardResult, setCardResult] = useState(null)
  const [cardPassword, setCardPassword] = useState('')

  // Aadhaar OCR & OTP authentication state
  const [aadhaarFile, setAadhaarFile] = useState(null)
  const [aadhaarScanning, setAadhaarScanning] = useState(false)
  const [aadhaarData, setAadhaarData] = useState(null)
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [refId, setRefId] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [loginSuccess, setLoginSuccess] = useState(false)

  useEffect(() => {
    if (otpCountdown <= 0) return
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [otpCountdown])

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

  const handleAadhaarFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAadhaarFile(file)
    setAadhaarScanning(true)
    setError(null)
    setAadhaarData(null)
    setOtpSent(false)
    setDevOtp('')
    setOtpCode('')
    setLoginSuccess(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      let res
      try {
        res = await api.post('/aadhaar/extract-public', formData, { timeout: 60000 })
      } catch (err) {
        res = await api.post('/ayushman/extract-public', formData, { timeout: 60000 })
      }

      const extracted = res.data?.extracted_fields || {}
      const aadhaarNum = extracted.aadhaar_number || (extracted.last_four ? `XXXX XXXX ${extracted.last_four}` : '')

      const data = {
        name: extracted.name || '',
        aadhaarNumber: aadhaarNum,
        dob: extracted.dob || '',
        gender: extracted.gender || 'Male',
        phone: extracted.phone || '',
      }

      setAadhaarData(data)

      // Automatically send OTP if Aadhaar number or phone is identified
      if (data.aadhaarNumber || data.phone) {
        sendAadhaarOtp(data.aadhaarNumber || data.phone)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Card scanning failed. Please enter your Aadhaar details manually below.'
      )
      setAadhaarData({
        name: '',
        aadhaarNumber: '',
        dob: '',
        gender: 'Male',
        phone: '',
      })
    } finally {
      setAadhaarScanning(false)
    }
  }

  const sendAadhaarOtp = async (destinationOverride) => {
    const dest = destinationOverride || aadhaarData?.aadhaarNumber || aadhaarData?.phone
    if (!dest || dest.trim().length < 4) {
      setError('Please provide a valid 12-digit Aadhaar number to receive OTP.')
      return
    }

    setOtpSending(true)
    setError(null)

    try {
      const res = await api.post('/verification/send-otp', {
        channel: 'aadhaar',
        destination: dest.trim(),
      })

      setOtpSent(true)
      // Cashfree guidelines: allow ~45-50s before resending to avoid 409 conflict
      setOtpCountdown(45)

      const receivedRefId = res.data?.ref_id || res.data?.refId || ''
      if (receivedRefId) {
        setRefId(receivedRefId)
      }
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to dispatch Aadhaar OTP via Cashfree UIDAI. Please check the Aadhaar number.'
      )
    } finally {
      setOtpSending(false)
    }
  }

  const submitAadhaarLogin = async (e) => {
    if (e) e.preventDefault()
    if (!aadhaarData?.aadhaarNumber) {
      setError('Please enter or scan your Aadhaar number.')
      return
    }
    if (!otpCode || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit verification OTP.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      await loginWithAadhaar({
        aadhaarNumber: aadhaarData.aadhaarNumber,
        fullName: aadhaarData.name,
        dob: aadhaarData.dob,
        gender: aadhaarData.gender,
        phone: aadhaarData.phone,
        otp: otpCode.trim(),
        refId: refId || '',
        ref_id: refId || '',
      })
      setLoginSuccess(true)
      setTimeout(() => nav('/'), 500)
    } catch (err) {
      setError(errMsg(err) || 'Aadhaar OTP verification failed. Please try again.')
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
          <div className="space-y-4">
            {/* File Upload Box */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-teal-900 text-sm">
                  🪪 Upload Aadhaar Card
                </span>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                  Password-Free
                </span>
              </div>
              <p className="mb-2.5 text-slate-600">
                Upload your Aadhaar card image. Details will auto-populate and an OTP will authenticate you.
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                disabled={aadhaarScanning || busy}
                onChange={handleAadhaarFileChange}
                className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-700 cursor-pointer transition"
              />
              {aadhaarFile && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-teal-800 font-medium break-all">
                  <span>📄</span> {aadhaarFile.name}
                </div>
              )}
            </div>

            {/* Quick Sandbox Test Helper for Cashfree */}
            <div className="rounded-lg bg-sky-50 border border-sky-200 p-2.5 text-xs flex items-center justify-between text-sky-950 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-base">🧪</span>
                <div>
                  <p className="font-semibold text-[11px] leading-tight">Cashfree Sandbox Test Mode</p>
                  <p className="text-[10px] text-sky-700 font-mono">Aadhaar: 655675523712 | OTP: 111000</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const testInfo = {
                    name: 'SUKESH KUMAR',
                    aadhaarNumber: '655675523712',
                    dob: '12/04/1988',
                    gender: 'Male',
                    phone: '',
                  }
                  setAadhaarData(testInfo)
                  sendAadhaarOtp('655675523712')
                }}
                className="rounded bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-sky-700 transition"
              >
                Test Now
              </button>
            </div>

            {/* Scanning Indicator */}
            {aadhaarScanning && (
              <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-3 text-center animate-pulse">
                <div className="text-xs font-semibold text-teal-800 flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block">🔄</span>
                  Scanning Aadhaar Card via AI OCR...
                </div>
                <p className="text-[11px] text-teal-600 mt-1">Extracting Name, Aadhaar Number, DOB & Gender...</p>
              </div>
            )}

            {/* Extracted Details Card */}
            {aadhaarData && (
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-3 text-xs space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs">
                    <span className="text-emerald-600">✓</span> Aadhaar Information Fetched
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                    Auto-Filled
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-0.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Aadhaar Number / आधार नंबर
                    </label>
                    <input
                      type="text"
                      className="input font-mono text-xs font-semibold tracking-wider text-slate-800"
                      value={aadhaarData.aadhaarNumber}
                      onChange={(e) => setAadhaarData({ ...aadhaarData, aadhaarNumber: e.target.value })}
                      placeholder="XXXX XXXX 1234 or 12 digits"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Full Name / पूरा नाम
                    </label>
                    <input
                      type="text"
                      className="input text-xs text-slate-800"
                      value={aadhaarData.name}
                      onChange={(e) => setAadhaarData({ ...aadhaarData, name: e.target.value })}
                      placeholder="Name as printed on Aadhaar"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        DOB / जन्म तिथि
                      </label>
                      <input
                        type="text"
                        className="input text-xs text-slate-800"
                        value={aadhaarData.dob}
                        onChange={(e) => setAadhaarData({ ...aadhaarData, dob: e.target.value })}
                        placeholder="DD/MM/YYYY"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                        Gender / लिंग
                      </label>
                      <select
                        className="input text-xs text-slate-800"
                        value={aadhaarData.gender || 'Male'}
                        onChange={(e) => setAadhaarData({ ...aadhaarData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Transgender">Transgender</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Mobile Number (Linked with Aadhaar)
                    </label>
                    <input
                      type="tel"
                      className="input text-xs text-slate-800"
                      value={aadhaarData.phone}
                      onChange={(e) => setAadhaarData({ ...aadhaarData, phone: e.target.value })}
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OTP Flow */}
            {aadhaarData && (
              <div className="space-y-3 pt-1">
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={() => sendAadhaarOtp()}
                    disabled={otpSending || !aadhaarData.aadhaarNumber}
                    className="btn w-full flex items-center justify-center gap-1.5"
                  >
                    {otpSending ? 'Sending OTP...' : '📲 Send OTP to Aadhaar Linked Mobile'}
                  </button>
                ) : (
                  <form onSubmit={submitAadhaarLogin} className="space-y-3">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900 space-y-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span>📲 Enter 6-digit Aadhaar OTP</span>
                        {refId && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded border border-emerald-300">
                            Ref ID: {refId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>UIDAI OTP sent via Cashfree to linked mobile.</span>
                        {otpCountdown > 0 ? (
                          <span className="text-slate-500 font-normal">Resend in {otpCountdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => sendAadhaarOtp()}
                            disabled={otpSending}
                            className="text-teal-700 hover:underline font-semibold"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                      {devOtp && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setOtpCode(devOtp)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-200/70 hover:bg-emerald-300 text-emerald-900 font-mono text-[11px] font-bold transition"
                            title="Click to auto-fill"
                          >
                            <span>🧪 Test OTP:</span> <span>{devOtp}</span>
                            <span className="text-[9px] font-normal underline ml-1">(Click to fill)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••••"
                        className="input text-center font-mono text-xl tracking-[0.5em] font-bold text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy || otpCode.length < 4}
                      className="btn w-full flex items-center justify-center gap-1.5"
                    >
                      {busy ? (
                        <span>Authenticating...</span>
                      ) : (
                        <span>🔐 Verify OTP & Sign In</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {loginSuccess && (
              <div className="rounded-lg bg-emerald-100 border border-emerald-300 p-2.5 text-center text-xs text-emerald-900 font-semibold animate-pulse">
                ✓ Aadhaar Verified! Redirecting to Dashboard...
              </div>
            )}

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>
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
