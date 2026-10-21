import { useTranslation } from 'react-i18next'
export default function DisclaimerBanner() {
  const { t } = useTranslation()
  return <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">⚠️ {t('disclaimer')}</div>
}
