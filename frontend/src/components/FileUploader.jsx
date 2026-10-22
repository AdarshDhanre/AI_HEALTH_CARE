import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function FileUploader({ onFile, disabled }) {
  const { t } = useTranslation()
  const input = useRef(null)
  const [over, setOver] = useState(false)

  const pick = (file) => { if (file) onFile(file) }
  return (
    <div
      onClick={() => !disabled && input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) pick(e.dataTransfer.files[0]) }}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center text-sm text-slate-500 ${over ? 'border-teal-500 bg-teal-50' : 'border-slate-300'} ${disabled ? 'opacity-50' : ''}`}
    >
      📄 {t('report.drop')}
      <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
        onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} />
    </div>
  )
}
