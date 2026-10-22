import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createCase } from '../services/caseService'
import { errMsg } from '../utils/formatters'

export default function CaseTaking() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [f, setF] = useState({ chiefComplaint: '', symptoms: '', medicalHistory: '', lifestyle: '', notes: '' })
  const [ay, setAy] = useState({ prakriti: '', agni: '', koshtha: '', nidra: '' })
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try { setSaved(await createCase(id, { ...f, ayushDetails: ay })) } catch (err) { setError(errMsg(err)) } finally { setBusy(false) }
  }
  const area = (k, label) => (
    <div><label className="label">{label}</label>
      <textarea className="input" rows={2} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  )

  return (
    <form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{t('patient.case')}</h1>
      {area('chiefComplaint', t('case.chief'))}{area('symptoms', t('case.symptoms'))}
      {area('medicalHistory', t('case.history'))}{area('lifestyle', t('case.lifestyle'))}
      <fieldset className="rounded-lg border p-3"><legend className="px-1 text-sm font-medium">{t('case.ayush')}</legend>
        <div className="grid grid-cols-2 gap-3">
          {['prakriti', 'agni', 'koshtha', 'nidra'].map((k) => (
            <div key={k}><label className="label">{t(`case.${k}`)}</label>
              <input className="input" value={ay[k]} onChange={(e) => setAy({ ...ay, [k]: e.target.value })} /></div>
          ))}
        </div>
      </fieldset>
      {area('notes', t('case.notes'))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          ✅ {t('case.saved')}
          {saved.missingInfo?.length > 0 && <p className="mt-1 text-amber-800">{t('case.missing')}: {saved.missingInfo.map((m) => m.label).join(', ')}</p>}
        </div>
      )}
      <div className="flex gap-2"><button className="btn" disabled={busy}>{t('common.save')}</button>
        <Link className="btn-outline" to={`/patients/${id}/reports`}>{t('patient.reports')} →</Link></div>
    </form>
  )
}
