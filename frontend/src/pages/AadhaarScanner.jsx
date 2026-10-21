import { useEffect, useState } from 'react'

export default function AadhaarScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [lastFour, setLastFour] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleSubmit(event) {
    event.preventDefault()
    setNotice('Details captured for this session. This page does not perform official UIDAI verification or save the Aadhaar image.')
  }

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪪</span>
            <h1 className="text-2xl font-bold text-slate-800">Aadhaar Card System</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Dedicated Aadhaar card upload and reference form, similar to the Ayushman Bharat card screen.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200">
          Reference only — not UIDAI verified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Aadhaar Card Upload</h2>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Select Aadhaar image (PNG, JPEG, WEBP)</span>
            <input
              className="mt-2 block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-teal-700 hover:file:bg-teal-100 cursor-pointer border rounded-lg p-2"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setNotice('') }}
            />
          </label>
          {preview && (
            <div className="rounded-lg border bg-slate-50 p-2 flex items-center justify-center max-h-56 overflow-hidden">
              <img src={preview} alt="Aadhaar card preview" className="max-h-52 w-auto object-contain rounded" />
            </div>
          )}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            For privacy, do not upload or enter Aadhaar data unless you have an appropriate lawful basis and consent. This page previews the image locally and does not send it to a server.
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-800">Aadhaar Reference Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name (optional)</span>
              <input className="mt-1 w-full rounded-lg border p-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient name" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Date of birth (optional)</span>
              <input className="mt-1 w-full rounded-lg border p-2 text-sm" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Last four digits only</span>
              <input className="mt-1 w-full rounded-lg border p-2 text-sm" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" value={lastFour} onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="XXXX" />
            </label>
            <p className="text-xs text-slate-500">Do not enter the full 12-digit Aadhaar number. These details are not saved or verified by this page.</p>
            <button className="rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white" type="submit">Review Details</button>
          </form>
          {notice && <p role="status" className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-sm text-teal-800">{notice}</p>}
          {(name || dob || lastFour) && (
            <div className="rounded-lg border bg-slate-50 p-3 space-y-1 text-sm">
              <h3 className="font-semibold">Current session preview</h3>
              <p>Name: {name || 'Not provided'}</p>
              <p>Date of birth: {dob || 'Not provided'}</p>
              <p>Aadhaar reference: {lastFour ? `XXXX-XXXX-${lastFour}` : 'Not provided'}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
