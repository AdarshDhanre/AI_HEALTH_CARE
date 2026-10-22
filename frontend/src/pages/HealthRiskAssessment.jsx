import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { riskService } from '../services/riskService'
import { errMsg } from '../utils/formatters'
import SymptomVoiceAnalyzer from '../components/SymptomVoiceAnalyzer'

export default function HealthRiskAssessment() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    waist_cm: '',
    systolic_bp: '',
    diastolic_bp: '',
    fasting_glucose: '',
    hba1c: '',
    total_cholesterol: '',
    smoking_status: 'NEVER',
    alcohol_consumption: 'NONE',
    physical_activity: 'MODERATE',
    family_history_diabetes: 'ONE_PARENT',
    family_history_heart_disease: false,
    has_irregular_periods: false,
    daily_screen_time_hours: '',
    sleep_hours_per_night: '',
    high_stress: false,
    pure_vegetarian_diet: true,
    symptoms: [],
    language: 'en',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('form') // 'form' | 'voice'

  // A sidebar selection previews its questions; entering an age returns to age-based mode.
  const requestedMode = searchParams.get('mode')
  const previewMode = requestedMode === 'UNDER_45' || requestedMode === '45_AND_ABOVE' ? requestedMode : null
  const activeMode = previewMode || (formData.age >= 45 ? '45_AND_ABOVE' : 'UNDER_45')

  // Indian BMI calculation
  const bmiInfo = useMemo(() => {
    if (!formData.weight_kg || !formData.height_cm || formData.height_cm <= 0) return null
    const heightM = formData.height_cm / 100
    const val = Number((formData.weight_kg / (heightM * heightM)).toFixed(1))
    let category = 'Normal'
    let color = 'text-emerald-700 bg-emerald-50 border-emerald-200'
    if (val < 18.5) {
      category = 'Underweight'
      color = 'text-amber-700 bg-amber-50 border-amber-200'
    } else if (val >= 25.0) {
      category = 'Obese (Asian Indian)'
      color = 'text-red-700 bg-red-50 border-red-200'
    } else if (val >= 23.0) {
      category = 'Overweight (Asian Indian)'
      color = 'text-orange-700 bg-orange-50 border-orange-200'
    }
    return { val, category, color }
  }, [formData.weight_kg, formData.height_cm])

  // Instant Red-Flag symptom alert
  const hasEmergencySymptom = useMemo(() => {
    const s = formData.symptoms || []
    return (
      (s.includes('chest_pain') && (s.includes('excessive_sweating') || s.includes('severe_shortness_of_breath') || s.includes('dizziness'))) ||
      (s.includes('chest_pain') && s.includes('severe_shortness_of_breath'))
    )
  }, [formData.symptoms])

  const toggleSymptom = (symKey) => {
    setFormData((prev) => {
      const exists = prev.symptoms.includes(symKey)
      return {
        ...prev,
        symptoms: exists ? prev.symptoms.filter((k) => k !== symKey) : [...prev.symptoms, symKey],
      }
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'age' && previewMode) setSearchParams({}, { replace: true })
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value),
    }))
  }

  const validateAssessment = () => {
    const age = Number(formData.age)
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return 'Please enter a whole age between 1 and 120 years.'
    }
    if (!['MALE', 'FEMALE', 'OTHER'].includes(formData.gender)) {
      return 'Please select a gender before calculating the assessment.'
    }

    const checks = [
      ['height_cm', 'Height', 50, 250],
      ['weight_kg', 'Weight', 10, 300],
      ['waist_cm', 'Waist circumference', 40, 200],
      ['systolic_bp', 'Systolic blood pressure', 60, 260],
      ['diastolic_bp', 'Diastolic blood pressure', 40, 160],
      ['fasting_glucose', 'Fasting sugar', 30, 600],
      ['hba1c', 'HbA1c', 3, 18],
      ['total_cholesterol', 'Total cholesterol', 50, 600],
      ['daily_screen_time_hours', 'Daily screen time', 0, 24],
      ['sleep_hours_per_night', 'Sleep duration', 0, 24],
    ]
    for (const [field, label, min, max] of checks) {
      const value = formData[field]
      if (value !== '' && (Number(value) < min || Number(value) > max)) {
        return `${label} must be between ${min} and ${max}.`
      }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validateAssessment()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...formData,
        age: Number(formData.age),
        height_cm: formData.height_cm ? Number(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : null,
        waist_cm: formData.waist_cm ? Number(formData.waist_cm) : null,
        systolic_bp: formData.systolic_bp ? Number(formData.systolic_bp) : null,
        diastolic_bp: formData.diastolic_bp ? Number(formData.diastolic_bp) : null,
        fasting_glucose: formData.fasting_glucose ? Number(formData.fasting_glucose) : null,
        hba1c: formData.hba1c ? Number(formData.hba1c) : null,
        total_cholesterol: formData.total_cholesterol ? Number(formData.total_cholesterol) : null,
        daily_screen_time_hours: formData.daily_screen_time_hours ? Number(formData.daily_screen_time_hours) : null,
        sleep_hours_per_night: formData.sleep_hours_per_night ? Number(formData.sleep_hours_per_night) : null,
      }
      const resp = await riskService.predictRisk(payload)
      setResult(resp)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const isValidationFailure = err?.response?.status === 422 || String(err?.message || '').includes('422')
      setError(isValidationFailure
        ? 'Please check the age, gender, and health values entered, then try again.'
        : (errMsg(err) || 'Assessment calculation failed.'))
    } finally {
      setLoading(false)
    }
  }

  const symptomList = [
    { key: 'chest_pain', label: 'Chest pain or pressure (छाती में दर्द/दबाव)' },
    { key: 'excessive_sweating', label: 'Cold / excessive sweating (ठंडा पसीना)' },
    { key: 'severe_shortness_of_breath', label: 'Severe shortness of breath (सांस में बहुत तकलीफ)' },
    { key: 'mild_breathlessness', label: 'Mild breathlessness on walking (चलने पर सांस फूलना)' },
    { key: 'fatigue', label: 'Chronic fatigue / low energy (अत्यधिक थकान)' },
    { key: 'excessive_thirst', label: 'Excessive thirst (बार-बार तेज प्यास)' },
    { key: 'frequent_urination', label: 'Frequent urination (बार-बार पेशाब)' },
    { key: 'leg_swelling', label: 'Swelling in feet/ankles (पैरों/टखनों में सूजन)' },
    { key: 'dizziness', label: 'Dizziness or lightheadedness (चक्कर आना)' },
    { key: 'blurred_vision', label: 'Blurry or fluctuating vision (धुंधला दिखना)' },
    { key: 'joint_pain', label: 'Joint aches / stiffness (जोड़ों में दर्द)' },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 p-6 text-white shadow-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-100 backdrop-blur-sm">
              2-minute preventive health check
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Age-Based Health Risk Assessment
            </h1>
            <p className="mt-1 text-sm text-teal-100">
              Share only the details you know. The assessment explains risk indicators and helps you prepare for a doctor visit.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <span className="text-xs font-medium text-teal-200">Language:</span>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="rounded-lg bg-teal-900 px-3 py-1 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="mr">मराठी (Marathi)</option>
            </select>
          </div>
        </div>

      </div>

      {!result && activeTab === 'form' && (
        <div className="grid gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-slate-700 sm:grid-cols-3">
          <div><span className="mr-2 font-bold text-teal-700">1.</span><b>Start with your age</b><br /><span className="text-xs text-slate-500">We show the right questions for your age group.</span></div>
          <div><span className="mr-2 font-bold text-teal-700">2.</span><b>Add known health values</b><br /><span className="text-xs text-slate-500">Leave lab values blank if you do not have a recent test.</span></div>
          <div><span className="mr-2 font-bold text-teal-700">3.</span><b>Review the guidance</b><br /><span className="text-xs text-slate-500">Use it to discuss concerns with a qualified doctor.</span></div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'form'
              ? 'bg-white text-teal-700 shadow-sm border border-teal-100'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="text-base">📋</span>
          Detailed Risk Assessment
          <span className="hidden sm:inline text-xs font-normal opacity-70">— fill vitals form</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'voice'
              ? 'bg-white text-red-600 shadow-sm border border-red-100'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="text-base">🎙️</span>
          Voice / Text Symptom AI
          <span className="hidden sm:inline text-xs font-normal opacity-70">— Hindi, Marathi, English</span>
        </button>
      </div>

      {/* Emergency Warning if triggered in form */}
      {hasEmergencySymptom && (
        <div className="flex items-center gap-4 rounded-xl border-2 border-red-500 bg-red-50 p-4 text-red-900 shadow-sm animate-pulse">
          <div className="text-3xl">🚨</div>
          <div>
            <div className="font-bold uppercase tracking-wider text-red-700 text-sm">
              Immediate Medical Red Flag
            </div>
            <div className="text-sm">
              Chest pain accompanied by cold sweating or severe breathlessness requires immediate in-person evaluation. Do not delay or rely solely on online tools.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results Section (When available) */}
      {result && (
        <div className="space-y-6">
          {/* Emergency Alert Banner if result has is_emergency */}
          {result.is_emergency && (
            <div className="rounded-2xl border-2 border-red-600 bg-red-600 p-6 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <span className="text-4xl">⚠️</span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">CRITICAL EMERGENCY DETECTED</h2>
                  <p className="mt-1 text-sm text-red-100 font-medium">{result.emergency_message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Overall Health Score Card */}
          <div className="card border-l-4 border-l-teal-600">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Assessment Result Summary
                </span>
                <h2 className="text-xl font-bold text-slate-800">
                  {result.mode === '45_AND_ABOVE' ? 'Senior Preventive Evaluation (45+)' : 'Young Adult Health Screening (< 45)'}
                </h2>
                <p className="text-xs text-slate-500">
                  Evaluated for: {result.age} yrs · {result.gender} · BMI: {result.bmi || 'N/A'} ({result.bmi_category || 'N/A'})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Overall Risk Level</div>
                  <span
                    className={`inline-block rounded-full px-4 py-1 text-sm font-bold uppercase tracking-wider ${
                      result.overall_risk_level === 'CRITICAL'
                        ? 'bg-red-600 text-white animate-pulse'
                        : result.overall_risk_level === 'HIGH'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : result.overall_risk_level === 'MODERATE'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {result.overall_risk_level} RISK
                  </span>
                </div>
              </div>
            </div>

            {/* Condition Risk Cards */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {result.risks.map((c, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{c.condition}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : c.risk_level === 'MODERATE'
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      {c.risk_level}
                    </span>
                  </div>

                  {c.score != null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Calculated Score</span>
                        <span>{c.score} / {c.max_score}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full transition-all ${
                            c.risk_level === 'HIGH' ? 'bg-red-500' : c.risk_level === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (c.score / (c.max_score || 100)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-600">Contributing Factors:</div>
                    <ul className="mt-1 space-y-0.5 text-xs text-slate-600 list-disc list-inside">
                      {c.reasons.map((r, ri) => (
                        <li key={ri}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  {c.recommendations && c.recommendations.length > 0 && (
                    <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-teal-800">
                      <span className="font-semibold">Next Step:</span> {c.recommendations[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Plain Language Explanation */}
          <div className="card bg-gradient-to-br from-teal-50/50 via-white to-cyan-50/40 border-teal-200 shadow-sm">
            <div className="flex items-center gap-2 text-teal-800 font-bold">
              <span className="text-xl">✨</span>
              <span>Gemini AI Health Explanation ({result.language?.toUpperCase() || 'EN'})</span>
            </div>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 bg-white/80 p-4 rounded-xl border border-teal-100">
              {result.ai_explanation}
            </div>
          </div>

          {/* Recommended Tests & Lifestyle Action Plan */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span>🧪</span> Recommended Preventive Tests
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Discuss these laboratory tests with your doctor for diagnostic confirmation:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                {result.recommended_tests.map((test, ti) => (
                  <li key={ti} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 border border-slate-100">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>{test}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span>🥗</span> Lifestyle & Diet Precautions
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Scientifically proven habits to reduce your risk:
              </p>
              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                {result.lifestyle_precautions.map((item, li) => (
                  <li key={li} className="flex items-start gap-2 rounded-lg bg-emerald-50/50 p-2 border border-emerald-100">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* When to see doctor */}
          <div className="card border-l-4 border-l-amber-500">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <span>🩺</span> When to Consult a Doctor
            </div>
            <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc list-inside">
              {result.when_to_see_doctor.map((w, wi) => (
                <li key={wi}>{w}</li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-600">
            <strong>Medical Disclaimer:</strong> {result.disclaimer}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setResult(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="btn-outline text-sm"
            >
              Modify Answers / Run Another Test
            </button>
          </div>
        </div>
      )}

      {/* Voice/Text Symptom Analyzer Tab */}
      {activeTab === 'voice' && (
        <div className="card border-teal-100 shadow-sm">
          <SymptomVoiceAnalyzer defaultLanguage={formData.language || 'hi'} />
        </div>
      )}

      {/* Main Form */}
      {!result && activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Demographics & Indian BMI Meter */}
          <div className="card">
            <h2 className="text-base font-bold text-slate-800">
              1. Basic Profile & Physical Vitals
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="label">
                  Age (आयु) <span className="text-teal-600 font-bold">{formData.age} yrs</span>
                </label>
                <input
                  type="number"
                  name="age"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  className="input"
                  required
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  {formData.age >= 45 ? 'Senior Screening Mode (45+)' : 'Young Adult Mode (<45)'}
                </span>
              </div>

              <div>
                <label className="label">Gender (लिंग)</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="input" required>
                  <option value="" disabled>Select gender</option>
                  <option value="MALE">Male (पुरुष)</option>
                  <option value="FEMALE">Female (महिला)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Height (ऊंचाई in cm)</label>
                <input
                  type="number"
                  name="height_cm"
                  placeholder="e.g. 170"
                  value={formData.height_cm}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Weight (वजन in kg)</label>
                <input
                  type="number"
                  name="weight_kg"
                  placeholder="e.g. 72"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            {/* Live Indian BMI Indicator */}
            {bmiInfo && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3 bg-slate-50 border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Calculated BMI:</span>
                <span className="text-lg font-bold text-slate-800">{bmiInfo.val} kg/m²</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${bmiInfo.color}`}>
                  {bmiInfo.category}
                </span>
                <span className="text-xs text-slate-500 ml-auto hidden sm:inline">
                  (Indian cutoffs: &lt;18.5 Underweight · 18.5-22.9 Normal · 23-24.9 Overweight · ≥25 Obese)
                </span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="label">Waist Circumference (कमर का घेरा in cm)</label>
                <input
                  type="number"
                  name="waist_cm"
                  placeholder="e.g. 88"
                  value={formData.waist_cm}
                  onChange={handleChange}
                  className="input"
                />
                <span className="text-[11px] text-slate-500">Key for Indian Diabetes Risk Score (IDRS)</span>
              </div>

              <div>
                <label className="label">Physical Activity (शारीरिक गतिविधि)</label>
                <select name="physical_activity" value={formData.physical_activity} onChange={handleChange} className="input">
                  <option value="VIGOROUS">Vigorous (Daily gym / strenuous work)</option>
                  <option value="MODERATE">Moderate (Brisk walk, regular chores)</option>
                  <option value="SEDENTARY">Sedentary (Desk job, minimal activity)</option>
                </select>
              </div>

              <div>
                <label className="label">Family History of Diabetes (परिवार में शुगर)</label>
                <select name="family_history_diabetes" value={formData.family_history_diabetes} onChange={handleChange} className="input">
                  <option value="NONE">Neither Parent (किसी को नहीं)</option>
                  <option value="ONE_PARENT">One Parent (माता या पिता)</option>
                  <option value="BOTH_PARENTS">Both Parents (माता और पिता दोनों)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Age Mode Specific Checks */}
          {activeMode === '45_AND_ABOVE' ? (
            <div className="card border-teal-200 bg-teal-50/20">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-teal-900">
                  2. 45+ Senior Clinical Metrics & Blood Panel
                </h2>
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                  Cardiovascular & Diabetes Focus
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Fill known recent test values (leave empty if not tested recently):
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="label">Systolic BP (ऊपर का BP)</label>
                  <input
                    type="number"
                    name="systolic_bp"
                    placeholder="e.g. 130"
                    value={formData.systolic_bp}
                    onChange={handleChange}
                    className="input"
                  />
                  <span className="text-[11px] text-slate-500">Normal &lt; 120 mmHg</span>
                </div>

                <div>
                  <label className="label">Diastolic BP (नीचे का BP)</label>
                  <input
                    type="number"
                    name="diastolic_bp"
                    placeholder="e.g. 85"
                    value={formData.diastolic_bp}
                    onChange={handleChange}
                    className="input"
                  />
                  <span className="text-[11px] text-slate-500">Normal &lt; 80 mmHg</span>
                </div>

                <div>
                  <label className="label">Fasting Sugar (खाली पेट शुगर)</label>
                  <input
                    type="number"
                    name="fasting_glucose"
                    placeholder="e.g. 105 mg/dL"
                    value={formData.fasting_glucose}
                    onChange={handleChange}
                    className="input"
                  />
                  <span className="text-[11px] text-slate-500">Normal 70-99 mg/dL</span>
                </div>

                <div>
                  <label className="label">HbA1c (% में 3 महीने का औसत)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="hba1c"
                    placeholder="e.g. 5.8"
                    value={formData.hba1c}
                    onChange={handleChange}
                    className="input"
                  />
                  <span className="text-[11px] text-slate-500">Normal &lt; 5.7%</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Total Cholesterol (कोलेस्ट्रॉल)</label>
                  <input
                    type="number"
                    name="total_cholesterol"
                    placeholder="e.g. 210 mg/dL"
                    value={formData.total_cholesterol}
                    onChange={handleChange}
                    className="input"
                  />
                  <span className="text-[11px] text-slate-500">Normal &lt; 200 mg/dL</span>
                </div>

                <div>
                  <label className="label">Smoking Status (धूम्रपान)</label>
                  <select name="smoking_status" value={formData.smoking_status} onChange={handleChange} className="input">
                    <option value="NEVER">Never (कभी नहीं)</option>
                    <option value="FORMER">Former smoker (छोड़ दिया)</option>
                    <option value="CURRENT">Current smoker (वर्तमान में)</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="family_history_heart_disease"
                      checked={formData.family_history_heart_disease}
                      onChange={handleChange}
                      className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Family History of Early Heart Disease / Stroke</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-emerald-200 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-emerald-900">
                  2. Under-45 Lifestyle, Nutrition & Hormone Indicators
                </h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Young Adult Health Mode
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Evaluation of lifestyle burnout, screen fatigue, sleep debt and micronutrients:
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">Daily Screen Time (स्क्रीन समय hrs/day)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="daily_screen_time_hours"
                    placeholder="e.g. 9"
                    value={formData.daily_screen_time_hours}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Sleep Duration (नींद hrs/night)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="sleep_hours_per_night"
                    placeholder="e.g. 6.5"
                    value={formData.sleep_hours_per_night}
                    onChange={handleChange}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Dietary Habit (खानपान)</label>
                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="pure_vegetarian_diet"
                        checked={formData.pure_vegetarian_diet}
                        onChange={handleChange}
                        className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Strict Vegetarian (Check B12/Iron risk)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="high_stress"
                    checked={formData.high_stress}
                    onChange={handleChange}
                    className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Experiencing Chronic Work / Mental Stress (तनाव)</span>
                </label>

                {formData.gender === 'FEMALE' && (
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="has_irregular_periods"
                      checked={formData.has_irregular_periods}
                      onChange={handleChange}
                      className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Irregular or Missed Menstrual Cycles (PCOS risk indicator)</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Symptoms Checklist */}
          <div className="card">
            <h2 className="text-base font-bold text-slate-800">
              3. Current Symptoms Checklist (लक्षण चुनें)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Select any symptoms you have experienced in recent weeks:
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {symptomList.map((sym) => {
                const checked = formData.symptoms.includes(sym.key)
                const isEmergencyItem = sym.key === 'chest_pain' || sym.key === 'excessive_sweating' || sym.key === 'severe_shortness_of_breath'
                return (
                  <label
                    key={sym.key}
                    onClick={() => toggleSymptom(sym.key)}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                      checked
                        ? isEmergencyItem
                          ? 'border-red-400 bg-red-50 text-red-900 font-medium'
                          : 'border-teal-500 bg-teal-50 text-teal-900 font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>{sym.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Your answers are used only to create this screening result.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn px-6 py-2.5 text-base font-semibold shadow-md shadow-teal-700/20"
            >
              {loading ? 'Evaluating Health Risks with AI...' : 'Calculate Health Risk Assessment →'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
