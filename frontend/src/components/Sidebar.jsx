import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'

export default function Sidebar() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { pathname, search } = useLocation()
  const clinical = user?.role === 'DOCTOR' || user?.role === 'PATIENT'
  const isRiskAssessment = pathname === '/risk-assessment'
  const selectedMode = new URLSearchParams(search).get('mode')
  const items = [
    clinical && { to: '/', label: t('nav.dashboard'), icon: '⌂', end: true },
    clinical && { to: '/patients', label: t('nav.patients'), icon: '♙' },
    clinical && { to: '/risk-assessment', label: 'Health Risk AI', icon: '♡' },
    clinical && { to: '/ayushman-scanner', label: 'Ayushman Card Scanner', icon: '▣' },
    user?.role === 'ADMIN' && { to: '/admin/users', label: t('nav.users'), icon: '⚙' },
    (user?.role === 'RESEARCHER' || user?.role === 'ADMIN') && { to: '/research', label: t('nav.analytics'), icon: '◫' },
  ].filter(Boolean)
  return (
    <nav className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-3 md:block">
      <p className="px-3 pb-3 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end}
          className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-teal-50 hover:text-teal-800'}`}>
          <span className="flex h-6 w-6 items-center justify-center text-base">{i.icon}</span>
          <span>{i.label}</span>
        </NavLink>
      ))}
      {isRiskAssessment && (
        <section className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">Choose assessment mode</p>
          <p className="mb-3 text-[11px] leading-relaxed text-slate-500">Select a mode to open its questions.</p>
          <div className="space-y-2">
            <Link
              to="/risk-assessment?mode=UNDER_45"
              className={`block rounded-xl border p-3 transition ${selectedMode === 'UNDER_45' ? 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200' : 'border-emerald-100 bg-white hover:border-emerald-300 hover:bg-emerald-50'}`}
            >
              <p className="text-sm font-bold text-slate-800">🌱 Mode 1: Age &lt; 45</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Micronutrients, anemia, PCOS, stress, sleep and early metabolic resistance.</p>
              <p className="mt-2 text-[11px] font-bold text-emerald-700">Open Mode 1 →</p>
            </Link>
            <Link
              to="/risk-assessment?mode=45_AND_ABOVE"
              className={`block rounded-xl border p-3 transition ${selectedMode === '45_AND_ABOVE' ? 'border-teal-500 bg-teal-100 ring-2 ring-teal-200' : 'border-teal-200 bg-white hover:border-teal-400 hover:bg-teal-50'}`}
            >
              <p className="text-sm font-bold text-slate-800">🛡️ Mode 2: Age 45+</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">IDRS diabetes, cardiovascular health, blood pressure and kidney risk indicators.</p>
              <p className="mt-2 text-[11px] font-bold text-teal-700">Open Mode 2 →</p>
            </Link>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-teal-800">Final result is always based on the age entered in the form.</p>
        </section>
      )}
    </nav>
  )
}
