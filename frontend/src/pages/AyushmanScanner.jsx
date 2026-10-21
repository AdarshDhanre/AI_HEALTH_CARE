import { useState } from 'react'
import api from '../services/api'

const fields = [
  ['name', 'Name'],
  ['dob', 'Date of birth'],
  ['gender', 'Gender'],
  ['pmjay_id', 'PM-JAY / ID'],
  ['reference', 'Reference'],
]

export default function AyushmanScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)

  function handleFileChange(selectedFile) {
    if (!selectedFile) {
      setFile(null)
      setPreview(null)
      return
    }
    setFile(selectedFile)
    setResult(null)
    setError('')
    const url = URL.createObjectURL(selectedFile)
    setPreview(url)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!file) {
      setError('Please select an Ayushman card image first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post(
        '/ayushman/extract',
        formData,
        { timeout: 60000 },
      )
      setResult(response.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'OCR extraction failed. Ensure the Ayushman OCR service (port 8001) and Java backend are running.',
      )
    } finally {
      setLoading(false)
    }
  }

  const copyValue = (key, val) => {
    if (!val) return
    navigator.clipboard.writeText(val)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪪</span>
            <h1 className="text-2xl font-bold text-slate-800">
              Ayushman Bharat Card Scanner
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            AI-powered OCR extraction for Ayushman PM-JAY and ABHA beneficiary cards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 border border-teal-200">
            Port 8001 Connected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Form */}
        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Card Upload</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Select Card Image (PNG, JPEG, WEBP)
              </span>
              <input
                className="mt-2 block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100 cursor-pointer border rounded-lg p-2"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </label>

            {preview && (
              <div className="relative rounded-lg border bg-slate-50 p-2 overflow-hidden flex items-center justify-center max-h-56">
                <img
                  src={preview}
                  alt="Card Preview"
                  className="max-h-52 w-auto object-contain rounded"
                />
              </div>
            )}

            <button
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition"
              type="submit"
              disabled={loading || !file}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing OCR & Classifier...
                </span>
              ) : (
                'Extract Card Details'
              )}
            </button>
          </form>

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <p className="font-semibold">Extraction Failed</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
        </section>

        {/* Results Card */}
        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Extracted Information</h2>
            {result && (
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                Extraction Complete
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-56 text-slate-400 text-center border-2 border-dashed rounded-lg p-6">
              <span className="text-3xl mb-2">📋</span>
              <p className="text-sm">Upload a card image and click extract to see patient and scheme fields.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-56 text-teal-600 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600 mb-3" />
              <p className="text-sm font-medium">Running Tesseract OCR & Field Classification...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                ⚠️ {result.warning || 'OCR results may require manual verification before patient record linking.'}
              </div>

              <dl className="divide-y divide-slate-100 rounded-lg border bg-slate-50/50">
                {fields.map(([key, label]) => {
                  const val = result.extracted_fields?.[key]
                  return (
                    <div key={key} className="flex items-center justify-between p-3 text-sm">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {label}
                      </dt>
                      <dd className="flex items-center gap-2 text-right">
                        <span className={`font-medium ${val ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                          {val || 'Not detected'}
                        </span>
                        {val && (
                          <button
                            type="button"
                            onClick={() => copyValue(key, val)}
                            title="Copy value"
                            className="rounded p-1 text-slate-400 hover:text-teal-600 transition"
                          >
                            {copiedKey === key ? '✓' : '📋'}
                          </button>
                        )}
                      </dd>
                    </div>
                  )
                })}
              </dl>

              <details className="rounded-lg border bg-slate-50 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900">
                  View Raw OCR Text & Classified Lines ({result.lines?.length || 0})
                </summary>
                <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded bg-white p-3 text-xs text-slate-700 border font-mono">
                  {result.raw_text || 'No text detected'}
                </pre>
              </details>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
