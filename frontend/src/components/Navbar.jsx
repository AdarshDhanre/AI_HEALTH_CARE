import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <Link to="/" className="text-lg font-bold text-teal-700">🩺 {t('app')}</Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {user && (
          <>
            <span className="hidden text-sm text-slate-600 sm:inline">{user.fullName} · {user.role}</span>
            <button className="btn-outline" onClick={logout}>{t('nav.logout')}</button>
          </>
        )}
      </div>
    </header>
  )
}
