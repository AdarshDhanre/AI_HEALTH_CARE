import { useTranslation } from 'react-i18next'
import { LEVEL } from '../utils/constants'
import { fmtNum, fmtRange } from '../utils/formatters'

export default function LabResultTable({ results, onEdit }) {
  const { t } = useTranslation()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2">{t('report.test')}</th><th>{t('report.value')}</th><th>{t('report.unit')}</th>
            <th>{t('report.range')}</th><th>{t('report.status')}</th>{onEdit && <th />}
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const lv = LEVEL[r.safetyLevel] || LEVEL.GREY
            return (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 font-medium">
                  {r.testName}
                  {r.needsReview && <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">{t('report.needsReview')}</span>}
                  {r.editedByDoctor && <span className="ml-2 text-xs text-slate-400">✎</span>}
                </td>
                <td>{fmtNum(r.value)}</td>
                <td>{r.unit || '-'}</td>
                <td>{fmtRange(r.refLow, r.refHigh)}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs ${lv.cls}`}>{lv.emoji} {r.flag}</span></td>
                {onEdit && <td><button className="text-teal-700 hover:underline" onClick={() => onEdit(r)}>{t('common.edit')}</button></td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
