import { useTranslation } from 'react-i18next'
export default function Loading() {
  const { t } = useTranslation()
  return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>
}
