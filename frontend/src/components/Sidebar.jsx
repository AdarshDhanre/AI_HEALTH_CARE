import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

export default function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const clinical = user?.role === 'DOCTOR' || user?.role === 'PATIENT'
  const items = [
    clinical && { to: '/', label: t('nav.dashboard'), end: true },
    clinical && { to: '/patients', label: t('nav.patients') },
    user?.role === 'ADMIN' && { to: '/admin/users', label: t('nav.users') },
    (user?.role === 'RESEARCHER' || user?.role === 'ADMIN') && { to: '/research', label: t('nav.analytics') },
  ].filter(Boolean)
  return (
    <nav className="w-52 shrink-0 border-r bg-white p-3">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end}
          className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-teal-50 font-medium text-teal-700' : 'text-slate-600 hover:bg-slate-100'}`}>
          {i.label}
        </NavLink>
      ))}
    </nav>
  )
}
