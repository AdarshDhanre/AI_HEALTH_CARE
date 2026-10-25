import { useState } from 'react'
import api from '../services/api'

const COPY = {
  en: {
    title: 'Patient Pre-Consultation Interview', subtitle: 'Tell us how you are feeling. Your answers will help prepare a concise summary for your doctor.',
    language: 'Interview language', complaint: 'What is bothering you most today?', onset: 'When did it start?', duration: 'How has it changed since it started?', severity: 'How severe is it?', symptoms: 'What other symptoms are you experiencing?', history: 'Do you have any existing medical conditions?', medicines: 'What medicines or supplements are you taking?', allergies: 'Do you have any allergies?', notes: 'Anything else you want your doctor to know?', mild: 'Mild', moderate: 'Moderate', severe: 'Severe', submit: 'Prepare summary for doctor', working: 'Preparing summary…', summary: 'Your pre-consultation summary', warning: 'This summary is based on your answers and is not a diagnosis. If you have severe breathing difficulty, chest pain, fainting, or another emergency, seek urgent medical care now.', reset: 'Edit answers', required: 'Please describe your main concern before continuing.', unknown: 'Not provided', durationOptions: ['Just started', 'A few hours', '1–3 days', '4–7 days', 'More than a week'], severityOptions: ['Mild', 'Moderate', 'Severe']
  },
  mr: {
    title: 'डॉक्टरांच्या भेटीपूर्वीची रुग्ण मुलाखत', subtitle: 'तुम्हाला कसे वाटत आहे ते सांगा. तुमच्या उत्तरांवरून डॉक्टरांसाठी संक्षिप्त सारांश तयार होईल.',
    language: 'मुलाखतीची भाषा', complaint: 'आज तुम्हाला सर्वात जास्त काय त्रास होत आहे?', onset: 'हा त्रास कधी सुरू झाला?', duration: 'त्रास सुरू झाल्यापासून त्यात काय बदल झाला?', severity: 'त्रास किती तीव्र आहे?', symptoms: 'इतर कोणती लक्षणे जाणवत आहेत?', history: 'तुम्हाला पूर्वीपासून काही आजार आहेत का?', medicines: 'तुम्ही कोणती औषधे किंवा पूरक पदार्थ घेत आहात?', allergies: 'तुम्हाला कोणती ॲलर्जी आहे का?', notes: 'डॉक्टरांना आणखी काही सांगायचे आहे का?', mild: 'सौम्य', moderate: 'मध्यम', severe: 'तीव्र', submit: 'डॉक्टरांसाठी सारांश तयार करा', working: 'सारांश तयार होत आहे…', summary: 'भेटीपूर्वीचा सारांश', warning: 'हा सारांश तुमच्या उत्तरांवर आधारित आहे; हे निदान नाही. श्वास घेण्यास तीव्र त्रास, छातीत दुखणे, बेशुद्ध पडणे किंवा आपत्कालीन लक्षणे असल्यास त्वरित वैद्यकीय मदत घ्या.', reset: 'उत्तरे बदला', required: 'कृपया मुख्य त्रासाचे वर्णन करा.', unknown: 'माहिती दिलेली नाही', durationOptions: ['आत्ताच सुरू झाला', 'काही तास', '१–३ दिवस', '४–७ दिवस', 'एका आठवड्यापेक्षा जास्त'], severityOptions: ['सौम्य', 'मध्यम', 'तीव्र']
  },
  hi: {
    title: 'डॉक्टर से मिलने से पहले मरीज की जानकारी', subtitle: 'बताएं कि आप कैसा महसूस कर रहे हैं। आपके जवाबों से डॉक्टर के लिए संक्षिप्त सारांश तैयार होगा।',
    language: 'बातचीत की भाषा', complaint: 'आज आपको सबसे ज्यादा क्या परेशानी है?', onset: 'यह परेशानी कब शुरू हुई?', duration: 'शुरू होने के बाद इसमें क्या बदलाव आया?', severity: 'परेशानी कितनी गंभीर है?', symptoms: 'आपको और कौन से लक्षण हो रहे हैं?', history: 'क्या आपको पहले से कोई बीमारी है?', medicines: 'आप कौन सी दवाएं या सप्लीमेंट ले रहे हैं?', allergies: 'क्या आपको किसी चीज से एलर्जी है?', notes: 'क्या आप डॉक्टर को कुछ और बताना चाहते हैं?', mild: 'हल्की', moderate: 'मध्यम', severe: 'गंभीर', submit: 'डॉक्टर के लिए सारांश बनाएं', working: 'सारांश तैयार हो रहा है…', summary: 'डॉक्टर से मिलने से पहले का सारांश', warning: 'यह सारांश आपके जवाबों पर आधारित है, निदान नहीं है। सांस लेने में गंभीर परेशानी, सीने में दर्द, बेहोशी या अन्य आपातकालीन लक्षण हों तो तुरंत चिकित्सा सहायता लें।', reset: 'जवाब बदलें', required: 'कृपया अपनी मुख्य परेशानी बताएं।', unknown: 'जानकारी नहीं दी गई', durationOptions: ['अभी शुरू हुआ', 'कुछ घंटे', '१–३ दिन', '४–७ दिन', 'एक सप्ताह से अधिक'], severityOptions: ['हल्की', 'मध्यम', 'गंभीर']
  }
}

const fields = ['complaint', 'onset', 'duration', 'severity', 'symptoms', 'history', 'medicines', 'allergies', 'notes']
export default function PatientInterview() {
  const [language, setLanguage] = useState('mr')
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const t = COPY[language]
  const set = (key, value) => setAnswers((old) => ({ ...old, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!answers.complaint?.trim()) { setError(t.required); return }
    setBusy(true)
    try {
      const response = await api.post('/patient-interview/summary', { language, answers })
      setResult(response.data)
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.detail || 'Could not prepare summary. Check that both backends are running.')
    } finally { setBusy(false) }
  }
  const label = (key) => t[key]
  const input = (key) => key === 'duration' || key === 'severity'
    ? <select className="input" value={answers[key] || ''} onChange={(e) => set(key, e.target.value)}><option value="">—</option>{(key === 'duration' ? t.durationOptions : t.severityOptions).map((v) => <option key={v}>{v}</option>)}</select>
    : <textarea className="input" rows={key === 'complaint' || key === 'symptoms' || key === 'notes' ? 3 : 2} value={answers[key] || ''} onChange={(e) => set(key, e.target.value)} placeholder={t.unknown} />
  return <div className="mx-auto max-w-3xl space-y-5">
    <header><p className="text-sm font-semibold uppercase tracking-wide text-teal-700">MediCase-AI · Patient intake</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{t.title}</h1><p className="mt-2 text-sm text-slate-600">{t.subtitle}</p></header>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t.warning}</div>
    {!result ? <form onSubmit={submit} className="card space-y-5">
      <div><label className="label">{t.language}</label><select className="input" value={language} onChange={(e) => { setLanguage(e.target.value); setResult(null); setError('') }}><option value="en">English</option><option value="mr">मराठी</option><option value="hi">हिन्दी</option></select></div>
      {fields.map((key, index) => <div key={key}><label className="label">{index + 1}. {label(key)}{key === 'complaint' ? ' *' : ''}</label>{input(key)}</div>)}
      {error && <p role="alert" className="text-sm text-red-700">{String(error)}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? t.working : t.submit}</button>
    </form> : <section className="card space-y-4">
      <h2 className="text-xl font-semibold">{t.summary}</h2>
      <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7">{result.summary}</p>
      <p className="text-xs text-slate-500">{result.disclaimer}</p>
      <div className="flex flex-wrap gap-2"><button className="btn-outline" onClick={() => setResult(null)}>{t.reset}</button><button className="btn" onClick={() => window.print()}>Print summary</button></div>
    </section>}
  </div>
}
