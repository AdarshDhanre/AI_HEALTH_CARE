import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../utils/constants'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const change = (e) => {
    i18n.changeLanguage(e.target.value)
    try { localStorage.setItem('lang', e.target.value) } catch { /* ignore */ }
  }
  return (
    <select value={i18n.resolvedLanguage} onChange={change} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm">
      {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
    </select>
  )
}
