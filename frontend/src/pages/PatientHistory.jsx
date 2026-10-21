import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TrendChart from '../components/TrendChart'
import Loading from '../components/Loading'
import DisclaimerBanner from '../components/DisclaimerBanner'
import { getCompare, getTests, getTrend } from '../services/patientService'
import { errMsg, fmtDate, fmtNum } from '../utils/formatters'

export default function PatientHistory() {
  const { id } = useParams()
  const { t } = useTranslation()
  const [tests, setTests] = useState(null)
  const [test, setTest] = useState('')
  const [trend, setTrend] = useState(null)
  const [compare, setCompare] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    getTests(id).then((x) => { setTests(x); if (x[0]) setTest(x[0]) }).catch((e) => setError(errMsg(e)))
    getCompare(id).then(setCompare).catch(() => {})
  }, [id])
  useEffect(() => { if (test) getTrend(id, test).then(setTrend).catch((e) => setError(errMsg(e))) }, [id, test])

  if (error) return <p className="text-red-600">{error}</p>
  if (!tests) return <Loading />
  if (tests.length === 0) return <p className="text-slate-500">{t('common.none')}</p>

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t('patient.history')}</h1>
      <DisclaimerBanner />
      <div className="card space-y-3">
        <select className="input max-w-xs" value={test} onChange={(e) => setTest(e.target.value)}>
          {tests.map((x) => <option key={x}>{x}</option>)}
        </select>
        {trend && (<>
          <TrendChart trend={trend} />
          <p className="text-sm text-slate-600">{trend.message}</p>
          <table className="w-full text-left text-sm"><tbody>
            {trend.points.map((p, i) => <tr key={i} className="border-b last:border-0"><td className="py-1">{fmtDate(p.date)}</td><td>{fmtNum(p.value)} {trend.unit}</td><td>{p.flag}</td></tr>)}
          </tbody></table>
        </>)}
      </div>
      <div className="card">
        <h2 className="mb-2 font-semibold">{t('trend.compare')}</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-2">{t('report.test')}</th><th>{t('trend.previous')}</th><th>{t('trend.current')}</th><th /></tr></thead>
          <tbody>{compare.map((c) => (
            <tr key={c.test} className="border-b last:border-0"><td className="py-2">{c.test}</td>
              <td>{fmtNum(c.previousValue)} <span className="text-xs text-slate-400">{fmtDate(c.previousDate)}</span></td>
              <td>{fmtNum(c.currentValue)} {c.unit}</td><td>{{ UP: '⬆️', DOWN: '⬇️', SAME: '➡️', NEW: '🆕' }[c.direction]}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
