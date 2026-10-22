import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Loading from '../components/Loading'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { getDashboard, listPatients } from '../services/patientService'
import { fmtDate, fmtNum, errMsg } from '../utils/formatters'

const Tile = ({ emoji, n, label }) => (
  <div className="card text-center"><div className="text-2xl">{emoji}</div><div className="text-2xl font-bold">{n}</div><div className="text-xs text-slate-500">{label}</div></div>
)

export default function Dashboard() {
  const { t } = useTranslation()
  const [patients, setPatients] = useState(null)
  const [pid, setPid] = useState('')
  const [dash, setDash] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    listPatients().then((p) => { setPatients(p); if (p[0]) setPid(String(p[0].id)) }).catch((e) => setError(errMsg(e)))
  }, [])
  useEffect(() => {
    if (!pid) return
    setDash(null)
    getDashboard(pid).then(setDash).catch((e) => setError(errMsg(e)))
  }, [pid])

  if (error) return <p className="text-red-600">{error}</p>
  if (!patients) return <Loading />
  if (patients.length === 0) return <div className="card">{t('common.none')} <Link className="text-teal-700 underline" to="/patients/new">{t('patient.register')}</Link></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{t('nav.dashboard')}</h1>
        <select className="input max-w-xs" value={pid} onChange={(e) => setPid(e.target.value)}>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.patientUid})</option>)}
        </select>
      </div>
      <DisclaimerBanner />
      {!dash ? <Loading /> : dash.latestReportId == null ? (
        <div className="card">{t('common.none')} <Link className="text-teal-700 underline" to={`/patients/${pid}/reports`}>{t('report.upload')}</Link></div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{t('trend.compare')} · {fmtDate(dash.latestReportDate)} · {dash.reportCount} {t('patient.reports')}</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Tile emoji="🟢" n={dash.green} label="Normal" /><Tile emoji="🟡" n={dash.yellow} label="Outside range" />
            <Tile emoji="🔴" n={dash.red} label="Urgent" /><Tile emoji="⚪" n={dash.grey} label="Not assessed" />
          </div>
          <div className="card">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-2">{t('report.test')}</th><th>{t('trend.previous')}</th><th>{t('trend.current')}</th><th /></tr></thead>
              <tbody>{dash.comparison.map((c) => (
                <tr key={c.test} className="border-b last:border-0">
                  <td className="py-2">{c.test}</td><td>{fmtNum(c.previousValue)}</td><td>{fmtNum(c.currentValue)} {c.unit}</td>
                  <td>{{ UP: '⬆️', DOWN: '⬇️', SAME: '➡️', NEW: '🆕' }[c.direction]}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
