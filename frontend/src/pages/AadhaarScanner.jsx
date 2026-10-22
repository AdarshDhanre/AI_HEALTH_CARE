
import { useEffect, useState } from 'react'
import api from '../services/api'

const fields = [
  ['name', 'Name'],
  ['dob', 'Date of birth'],
  ['gender', 'Gender'],
  ['last_four', 'Last four Aadhaar digits'],
]

export default function AadhaarScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleFileChange(selectedFile) {
    setError('')
    setResult(null)
    setCopiedKey(null)

    if (!selectedFile) {
      setFile(null)
      return
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setFile(null)
      setError('Please select a PNG, JPEG, or WEBP image.')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFile(null)
      setError('Image size must be 5 MB or less.')
      return
    }

    setFile(selectedFile)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!file) {
      setError('Please select an Aadhaar image first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Requires a dedicated Aadhaar OCR endpoint in the backend.
      const response = await api.post(
        '/aadhaar/extract',
        formData,
        { timeout: 60000 },
      )

      setResult(response.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Aadhaar extraction failed. Check that the Java backend and Aadhaar OCR service are running.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function copyValue(key, value) {
    if (!value) return

    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedKey(key)
    } catch {
      setError('Could not copy the value. Please copy it manually.')
    }
  }

  const extracted = result?.extracted_fields || {}

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪪</span>
            <h1 className="text-2xl font-bold text-slate-800">
              Aadhaar Card Scanner
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            OCR extraction for Aadhaar reference details.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200">
          Reference only — not UIDAI verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aadhaar Upload */}
        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-800">
            Aadhaar Card Upload
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Select Aadhaar Image (PNG, JPEG, WEBP)
              </span>

              <input
                className="mt-2 block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100 cursor-pointer border rounded-lg p-2"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] || null)
                }
              />
            </label>

            {preview && (
              <div className="relative rounded-lg border bg-slate-50 p-2 overflow-hidden flex items-center justify-center max-h-56">
                <img
                  src={preview}
                  alt="Aadhaar image preview"
                  className="max-h-52 w-auto object-contain rounded"
                />
              </div>
            )}

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              The selected image will be sent to the OCR backend for
              extraction. Use only with appropriate authorization and
              consent. The OCR result is not official identity verification.
            </div>

            <button
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 transition"
              type="submit"
              disabled={loading || !file}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Extracting Aadhaar Details...
                </span>
              ) : (
                'Extract Aadhaar Details'
              )}
            </button>
          </form>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700"
            >
              <p className="font-semibold">Extraction Failed</p>
              <p className="mt-1">{error}</p>
            </div>
          )}
        </section>

        {/* Extracted Information */}
        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-800">
              Extracted Information
            </h2>

            {result && (
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                Extraction Complete
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-56 text-slate-400 text-center border-2 border-dashed rounded-lg p-6">
              <span className="text-3xl mb-2">📋</span>
              <p className="text-sm">
                Upload an Aadhaar image and click extract to see
                the available reference fields.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-56 text-teal-600 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600 mb-3" />
              <p className="text-sm font-medium">
                Processing Aadhaar image...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                ⚠️{' '}
                {result.warning ||
                  'OCR results may contain errors. Verify the extracted details manually.'}
              </div>

              <dl className="divide-y divide-slate-100 rounded-lg border bg-slate-50/50">
                {fields.map(([key, label]) => {
                  const value = extracted[key]

                  return (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 text-sm"
                    >
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {label}
                      </dt>

                      <dd className="flex items-center gap-2 sm:text-right">
                        <span
                          className={`font-medium break-all ${
                            value
                              ? 'text-slate-900'
                              : 'text-slate-400 italic'
                          }`}
                        >
                          {value || 'Not detected'}
                        </span>

                        {value && (
                          <button
                            type="button"
                            onClick={() => copyValue(key, value)}
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

              <p className="text-xs text-slate-500">
                Only the last four Aadhaar digits should be returned by
                the backend. Do not display or store the full Aadhaar number.
              </p>

              {result.raw_text && (
                <details className="rounded-lg border bg-slate-50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900">
                    View OCR Text
                  </summary>
                  <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded bg-white p-3 text-xs text-slate-700 border font-mono">
                    {result.raw_text}
                  </pre>
                </details>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
