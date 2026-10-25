import { useCallback, useEffect, useState } from 'react'
import { listReports } from '../services/reportService'
import { errMsg } from '../utils/formatters'

export function useReports(patientId) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    return listReports(patientId)
      .then(setReports)
      .catch((e) => {
        setReports([])
        setError(errMsg(e))
      })
      .finally(() => setLoading(false))
  }, [patientId])

  useEffect(() => { refresh() }, [refresh])
  return { reports, loading, error, refresh }
}
