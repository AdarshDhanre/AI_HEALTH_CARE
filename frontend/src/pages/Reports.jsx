import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FileUploader from '../components/FileUploader'
import DisclaimerBanner from '../components/DisclaimerBanner'
import Loading from '../components/Loading'
import { useReports } from '../hooks/useReports'
import { uploadReport } from '../services/reportService'
import { LEVEL } from '../utils/constants'
import { errMsg, fmtDate } from '../utils/formatters'

export default function Reports() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const { reports, loading, error, refresh } = useReports(id)
  const [busy, setBusy] = useState(false)
  const [upErr, setUpErr] = useState(null)

  const onFile = async (file) => {
    setBusy(true); setUpErr(null)
    try {
      const r = await uploadReport(id, file, i18n.resolvedLanguage)
      if (r.status === 'FAILED') { setUpErr(`${t('report.failed')}: ${r.errorMessage || ''}`); refresh() } else nav(`/reports/${r.id}`)
    } catch (e) { setUpErr(errMsg(e)) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t('patient.reports')}</h1>
      <DisclaimerBanner />
      <FileUploader onFile={onFile} disabled={busy} />
      {busy && <p className="text-sm text-slate-500">⏳ {t('common.loading')}</p>}
      {(upErr || error) && <p className="text-sm text-red-600">{upErr || error}</p>}
      {loading ? <Loading /> : reports.length === 0 ? <p className="text-slate-500">{t('common.none')}</p> : (
        <div className="space-y-2">
          {reports.map((r) => {
            const worst = r.results.some((x) => x.safetyLevel === 'RED') ? 'RED' : r.results.some((x) => x.safetyLevel === 'YELLOW') ? 'YELLOW' : r.results.length ? 'GREEN' : 'GREY'
            return (
              <Link key={r.id} to={`/reports/${r.id}`} className="card flex items-center justify-between hover:border-teal-400">
                <div><div className="font-medium">{r.originalFilename}</div>
                  <div className="text-xs text-slate-500">{fmtDate(r.reportDate)} · {r.labName || '-'} · {r.results.length} tests</div></div>
                <div className="flex items-center gap-2 text-sm">
                  {r.reviewed && <span title={t('report.confirmed')}>✔️</span>}
                  {r.status === 'FAILED' ? <span className="text-red-600">{t('report.failed')}</span> : <span>{LEVEL[worst].emoji}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
