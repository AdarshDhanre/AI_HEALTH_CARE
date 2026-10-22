import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Loading from '../components/Loading'
import PatientCard from '../components/PatientCard'
import { listPatients } from '../services/patientService'
import { errMsg } from '../utils/formatters'

export default function Patients() {
  const { t } = useTranslation()
  const [patients, setPatients] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => { listPatients().then(setPatients).catch((e) => setError(errMsg(e))) }, [])
  if (error) return <p className="text-red-600">{error}</p>
  if (!patients) return <Loading />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('nav.patients')}</h1>
        <Link className="btn" to="/patients/new">+ {t('patient.register')}</Link>
      </div>
      {patients.length === 0 ? <p className="text-slate-500">{t('common.none')}</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{patients.map((p) => <PatientCard key={p.id} patient={p} />)}</div>
      )}
    </div>
  )
}
