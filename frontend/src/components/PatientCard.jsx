import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { fmtDate } from '../utils/formatters'

export default function PatientCard({ patient }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{patient.name}</h3>
          <p className="text-xs text-slate-500">{patient.patientUid} · {patient.gender || '-'} · {fmtDate(patient.dob)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{patient.dietPref}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {user?.role === 'DOCTOR' && <Link className="btn-outline" to={`/patients/${patient.id}/case`}>{t('patient.case')}</Link>}
        <Link className="btn-outline" to={`/patients/${patient.id}/reports`}>{t('patient.reports')}</Link>
        <Link className="btn-outline" to={`/patients/${patient.id}/history`}>{t('patient.history')}</Link>
      </div>
    </div>
  )
}
