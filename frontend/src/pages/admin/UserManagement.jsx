import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Loading from '../../components/Loading'
import { useAuth } from '../../hooks/useAuth'
import { listUsers, setUserActive } from '../../services/adminService'
import { errMsg } from '../../utils/formatters'

export default function UserManagement() {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => { listUsers().then(setUsers).catch((e) => setError(errMsg(e))) }, [])

  const toggle = async (u) => {
    try {
      const upd = await setUserActive(u.id, !u.active)
      setUsers((list) => list.map((x) => (x.id === upd.id ? upd : x)))
    } catch (e) { setError(errMsg(e)) }
  }
  if (!users) return error ? <p className="text-red-600">{error}</p> : <Loading />
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('nav.users')}</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="py-2">{t('common.name')}</th><th>{t('auth.email')}</th><th>{t('auth.role')}</th><th>{t('admin.active')}</th><th /></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id} className="border-b last:border-0"><td className="py-2">{u.fullName}</td><td>{u.email}</td><td>{u.role}</td><td>{u.active ? '✅' : '⛔'}</td>
              <td>{u.id !== me.userId && <button className="text-teal-700 hover:underline" onClick={() => toggle(u)}>{u.active ? t('admin.deactivate') : t('admin.activate')}</button>}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
