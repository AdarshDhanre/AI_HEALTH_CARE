import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DisclaimerBanner from '../components/DisclaimerBanner'
import LabResultTable from '../components/LabResultTable'
import Loading from '../components/Loading'
import { useAuth } from '../hooks/useAuth'
import { confirmReport, getReport, updateResult } from '../services/reportService'
import { LEVEL } from '../utils/constants'
import { errMsg, fmtDate } from '../utils/formatters'

export default function ReportReview() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const isDoctor = user.role === 'DOCTOR'
  const [report, setReport] = useState(null)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => getReport(id, i18n.resolvedLanguage).then(setReport).catch((e) => setError(errMsg(e))), [id, i18n.resolvedLanguage])
  useEffect(() => { load() }, [load])

  const save = async (e) => {
    e.preventDefault()
    try {
      await updateResult(id, editing.id, {
        testName: editing.testName, value: Number(editing.value), unit: editing.unit,
        refLow: editing.refLow === '' || editing.refLow == null ? null : Number(editing.refLow),
        refHigh: editing.refHigh === '' || editing.refHigh == null ? null : Number(editing.refHigh),
      })
      setEditing(null); load()
    } catch (err) { setError(errMsg(err)) }
  }
  const confirm = () => confirmReport(id).then(setReport).catch((e) => setError(errMsg(e)))
  const downloadSummaryPdf = () => window.print() // choose "Save as PDF" in the print dialog

  if (error && !report) return <p className="text-red-600">{error}</p>
  if (!report) return <Loading />
  const s = report.summary
  const lv = s ? LEVEL[s.overallLevel] || LEVEL.GREY : null

  return (
    <div className="report-print-root mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">{report.originalFilename}</h1>
          <p className="text-sm text-slate-500">{fmtDate(report.reportDate)} · {report.labName || '-'}</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" className="btn no-print" onClick={downloadSummaryPdf}>Download Summary PDF</button><Link className="btn-outline no-print" to={`/patients/${report.patientId}/reports`}>← {t('common.back')}</Link></div>
      </div>
      <DisclaimerBanner />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {report.status === 'FAILED' && <p className="card text-red-600">{t('report.failed')}: {report.errorMessage}</p>}

      <div className="card">
        <LabResultTable results={report.results} onEdit={isDoctor ? (r) => setEditing({ ...r }) : null} />
        {isDoctor && (
          <div className="mt-4 flex items-center gap-3">
            {report.reviewed ? <span className="text-sm text-green-700">✔️ {t('report.confirmed')}</span>
              : <button className="btn" onClick={confirm}>{t('report.confirm')}</button>}
          </div>
        )}
      </div>

      {s && (
        <div className="card space-y-3">
          <h2 className="font-semibold">{lv.emoji} {t('report.summary')}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed">{s.summaryText}</p>
          {s.guidance?.guidance?.length > 0 && (
            <div><h3 className="mb-2 font-medium">{t('report.guidance')}</h3>
              {s.guidance.guidance.map((g) => (
                <div key={g.test_name} className="mb-3 rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="font-medium">{g.test_name} ({g.flag})</div>
                  {g.foods.length > 0 && <p className="mt-1"><b>{t('report.foods')}:</b> {g.foods.join(', ')}</p>}
                  {g.tips.length > 0 && <ul className="mt-1 list-disc pl-5">{g.tips.map((x, i) => <li key={i}>{x}</li>)}</ul>}
                </div>
              ))}
            </div>
          )}
          {s.guidance?.disclaimer && <p className="text-xs text-slate-500">{s.guidance.disclaimer}</p>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={save} className="card w-full max-w-md space-y-3">
            <h3 className="font-semibold">{t('common.edit')}: {editing.testName}</h3>
            {[['testName', t('report.test'), 'text'], ['value', t('report.value'), 'number'], ['unit', t('report.unit'), 'text'], ['refLow', 'Ref low', 'number'], ['refHigh', 'Ref high', 'number']].map(([k, label, type]) => (
              <div key={k}><label className="label">{label}</label>
                <input className="input" type={type} step="any" value={editing[k] ?? ''} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} /></div>
            ))}
            <div className="flex gap-2"><button className="btn">{t('common.save')}</button>
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>{t('common.cancel')}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
