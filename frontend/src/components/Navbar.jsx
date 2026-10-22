import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  return (
<<<<<<< HEAD
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-teal-800">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-base">🩺</span>
        <span>{t('app')}</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        {user && (
          <>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 lg:inline">{user.fullName} · {user.role}</span>
            <button className="btn-outline px-3 sm:px-4" onClick={logout}>Logout</button>
=======
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <Link to="/" className="text-lg font-bold text-teal-700">🩺 {t('app')}</Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {user && (
          <>
            <span className="hidden text-sm text-slate-600 sm:inline">{user.fullName} · {user.role}</span>
            <button className="btn-outline" onClick={logout}>{t('nav.logout')}</button>
>>>>>>> ff871da8f6e96120dd0412c6ea2d9eca47d8db3c
          </>
        )}
      </div>
    </header>
  )
}
