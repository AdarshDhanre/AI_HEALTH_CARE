import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Loading from '../../components/Loading'
import { getAnalytics } from '../../services/adminService'
import { errMsg } from '../../utils/formatters'

export default function Analytics() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => { getAnalytics().then(setData).catch((e) => setError(errMsg(e))) }, [])
  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <Loading />
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t('nav.analytics')}</h1>
      <p className="text-sm text-slate-500">{t('research.note', { n: data.minGroupSize })}</p>
      <div className="grid grid-cols-2 gap-4 md:max-w-md">
        <div className="card text-center"><div className="text-2xl font-bold">{data.patients}</div><div className="text-xs text-slate-500">{t('research.patients')}</div></div>
        <div className="card text-center"><div className="text-2xl font-bold">{data.reports}</div><div className="text-xs text-slate-500">{t('research.reports')}</div></div>
      </div>
      <div className="card h-96">
        <ResponsiveContainer>
          <BarChart data={data.tests}>
            <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="test" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
            <Bar dataKey="normal" stackId="a" fill="#22c55e" /><Bar dataKey="low" stackId="a" fill="#eab308" />
            <Bar dataKey="high" stackId="a" fill="#f97316" /><Bar dataKey="critical" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
