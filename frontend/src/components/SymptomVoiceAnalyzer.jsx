import { useState, useRef, useCallback, useEffect } from 'react'
import { riskService } from '../services/riskService'
import { errMsg } from '../utils/formatters'

export const SUPPORTED_LANGS = {
  hi: { name: 'हिंदी (Hindi)', code: 'hi-IN', placeholder: 'यहाँ अपनी समस्या लिखें या माइक से बोलें... जैसे: "मुझे पेट दर्द कर रहा है और बुखार आया है"' },
  en: { name: 'English', code: 'en-IN', placeholder: 'Type or speak your symptoms here... e.g. "I have stomach ache and mild fever"' },
  mr: { name: 'मराठी (Marathi)', code: 'mr-IN', placeholder: 'येथे तुमची समस्या लिहा किंवा बोला... उदा: "माझे पोट दुखत आहे आणि ताप आला आहे"' },
  gu: { name: 'ગુજરાતી (Gujarati)', code: 'gu-IN', placeholder: 'અહીં તમારી સમસ્યા લખો અથવા બોલો... જેમ કે: "મને પેટમાં દુખાવો છે અને તાવ છે"' },
  bn: { name: 'বাংলা (Bengali)', code: 'bn-IN', placeholder: 'এখানে আপনার সমস্যা লিখুন বা বলুন... যেমন: "আমার পেটে ব্যথা এবং জ্বর হয়েছে"' },
  ta: { name: 'தமிழ் (Tamil)', code: 'ta-IN', placeholder: 'உங்கள் பிரச்சனையை இங்கே பேசவும் அல்லது தட்டச்சு செய்யவும்... எ.கா: "எனக்கு வயிற்று வலி மற்றும் காய்ச்சல் உள்ளது"' },
  te: { name: 'తెలుగు (Telugu)', code: 'te-IN', placeholder: 'మీ సమస్యను ఇక్కడ టైప్ చేయండి లేదా మాట్లాడండి... ఉదా: "నాకు కడుపు నొప్పి మరియు జ్వరం ఉంది"' },
  kn: { name: 'ಕನ್ನಡ (Kannada)', code: 'kn-IN', placeholder: 'ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ ಅಥವಾ ಮಾತನಾಡಿ... ಉದಾ: "ನನಗೆ ಹೊಟ್ಟೆ ನೋವು ಮತ್ತು ಜ್ವರ ಬಂದಿದೆ"' },
  ml: { name: 'മലയാളം (Malayalam)', code: 'ml-IN', placeholder: 'നിങ്ങളുടെ പ്രശ്നം ഇവിടെ സംസാരിക്കുക അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക... ഉദാ: "എനിക്ക് വയറുവേദനയും പനിയും ഉണ്ട്"' },
  pa: { name: 'ਪੰਜਾਬੀ (Punjabi)', code: 'pa-IN', placeholder: 'ਇੱਥੇ ਆਪਣੀ ਸਮੱਸਿਆ ਲਿਖੋ ਜਾਂ ਬੋਲੋ... ਜਿਵੇਂ: "ਮੇਰੇ ਢਿੱਡ ਵਿੱਚ ਦਰਦ ਹੈ ਅਤੇ ਬੁਖ਼ਾਰ ਹੈ"' },
  ur: { name: 'اردو (Urdu)', code: 'ur-IN', placeholder: 'یہاں اپنی پریشانی لکھیں یا بولیں... مثلاً: "میرے پیٹ میں درد ہے اور بخار ہے"' },
  or: { name: 'ଓଡ଼ିଆ (Odia)', code: 'or-IN', placeholder: 'ଏଠାରେ ଆପଣଙ୍କର ସମସ୍ୟା ଲେଖନ୍ତୁ ବା କୁହନ୍ତୁ... ଯଥା: "ମୋର ପେଟ ଯନ୍ତ୍ରଣା ଏବଂ ଜ୍ୱର ହୋଇଛି"' },
}

export default function SymptomVoiceAnalyzer({ defaultLanguage = 'hi' }) {
  const [lang, setLang] = useState(defaultLanguage)
  const [text, setText] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [listening, setListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speechSpeed, setSpeechSpeed] = useState(0.92)
  const [voices, setVoices] = useState([])

  const recognitionRef = useRef(null)
  const isSpeakingRef = useRef(false)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(null)

  // Load available speech synthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) setVoices(v)
    }

    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Find best matching voice for selected language (never force an English voice onto Indian languages)
  const getBestVoice = useCallback((targetLang) => {
    if (!voices.length) return null
    const langInfo = SUPPORTED_LANGS[targetLang] || SUPPORTED_LANGS.hi
    const fullCode = langInfo.code.toLowerCase()
    const prefix = targetLang.toLowerCase()

    // 1. Exact match (e.g. mr-IN, hi-IN, gu-IN, ta-IN)
    let matched = voices.find((v) => v.lang.toLowerCase() === fullCode)
    // 2. Prefix match (e.g. mr, hi, gu, bn, ta, te, kn, ml, pa, ur)
    if (!matched) {
      matched = voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
    }
    // 3. Only if English is explicitly requested, allow any English voice
    if (!matched && prefix === 'en') {
      matched = voices.find((v) => v.lang.toLowerCase().startsWith('en'))
    }
    // Return matched voice or null (do NOT fallback to voices[0] or English when Indian language is selected)
    return matched || null
  }, [voices])

  // Stop Doctor speech (both audio player and Web Speech API)
  const stopDoctorSpeech = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (err) {
        // ignore
      }
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    isSpeakingRef.current = false
    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  // Pause / Resume Doctor speech
  const togglePauseSpeech = useCallback(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play()
        setIsPaused(false)
      } else {
        audioRef.current.pause()
        setIsPaused(true)
      }
      return
    }

    if (!('speechSynthesis' in window)) return
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    } else {
      window.speechSynthesis.pause()
      setIsPaused(true)
    }
  }, [isPaused])

  // Browser Web Speech API fallback if backend audio is unavailable
  const fallbackWebSpeech = useCallback((fullScript, currentLang) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false)
      setIsPaused(false)
      isSpeakingRef.current = false
      return
    }

    const sentences = fullScript
      .split(/(?<=[।!?.\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    if (!sentences.length) {
      setIsSpeaking(false)
      setIsPaused(false)
      isSpeakingRef.current = false
      return
    }

    const selectedVoice = getBestVoice(currentLang)
    let index = 0

    const speakNext = () => {
      if (!isSpeakingRef.current || index >= sentences.length) {
        setIsSpeaking(false)
        setIsPaused(false)
        isSpeakingRef.current = false
        return
      }

      const textChunk = sentences[index]
      index++

      const utterance = new SpeechSynthesisUtterance(textChunk)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      utterance.lang = selectedVoice?.lang || SUPPORTED_LANGS[currentLang]?.code || 'hi-IN'
      utterance.rate = speechSpeed
      utterance.pitch = 1.0

      utterance.onend = () => {
        setTimeout(speakNext, 180)
      }

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech error:', e)
        }
        setIsSpeaking(false)
        setIsPaused(false)
        isSpeakingRef.current = false
      }

      window.speechSynthesis.speak(utterance)
    }

    speakNext()
  }, [getBestVoice, speechSpeed])

  // Speak text as a real doctor with authentic native Indian voice
  const speakAsDoctor = useCallback(async (speechText, currentLang = lang) => {
    stopDoctorSpeech()

    const fullScript = (speechText || '').trim()
    if (!fullScript) return

    isSpeakingRef.current = true
    setIsSpeaking(true)
    setIsPaused(false)

    // Primary: High-fidelity native Indian voice TTS stream from backend
    try {
      const blob = await riskService.getTtsAudio(fullScript, currentLang)
      if (!isSpeakingRef.current) return // User stopped before audio downloaded

      const audioUrl = URL.createObjectURL(blob)
      audioUrlRef.current = audioUrl
      const audio = new Audio(audioUrl)
      audio.playbackRate = speechSpeed
      audioRef.current = audio

      audio.onended = () => {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        audioRef.current = null
        setIsSpeaking(false)
        setIsPaused(false)
        isSpeakingRef.current = false
      }

      audio.onerror = (e) => {
        console.warn('Audio element error, falling back to Web Speech API:', e)
        fallbackWebSpeech(fullScript, currentLang)
      }

      await audio.play()
    } catch (err) {
      console.warn('Backend TTS failed, falling back to Web Speech API:', err)
      fallbackWebSpeech(fullScript, currentLang)
    }
  }, [lang, speechSpeed, stopDoctorSpeech, fallbackWebSpeech])

  // Auto-speak when result arrives
  useEffect(() => {
    if (result && autoSpeak && !result.is_emergency) {
      const textToSpeak = result.spoken_summary || result.humanized_response
      const timer = setTimeout(() => {
        speakAsDoctor(textToSpeak, lang)
      }, 500)
      return () => clearTimeout(timer)
    } else if (result?.is_emergency && autoSpeak) {
      const emergencyWarning = result.emergency_warning || 'Emergency attention required.'
      speakAsDoctor(emergencyWarning, lang)
    }
  }, [result, autoSpeak, lang, speakAsDoctor])

  // Speech-to-Text (Voice input)
  const startVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.')
      return
    }

    stopDoctorSpeech()

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = SUPPORTED_LANGS[lang]?.code || 'hi-IN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interim += transcript
        }
      }
      if (finalTranscript) {
        setText((prev) => (prev + ' ' + finalTranscript).trim())
        setInterimText('')
      } else {
        setInterimText(interim)
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setError(`Voice recognition error: ${event.error}. Please check mic permissions.`)
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      setInterimText('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setError(null)
  }, [lang, stopDoctorSpeech])

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setListening(false)
    setInterimText('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullText = (text + ' ' + interimText).trim()
    if (!fullText) {
      setError('Please type or speak your symptoms first.')
      return
    }
    stopDoctorSpeech()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        user_text: fullText,
        language: lang,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
      }
      const resp = await riskService.analyzeSymptomText(payload)
      setResult(resp)
    } catch (err) {
      setError(errMsg(err) || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    stopDoctorSpeech()
    setText('')
    setInterimText('')
    setResult(null)
    setError(null)
    if (listening) stopVoice()
  }

  return (
    <div className="space-y-6">
      {/* Header & Language Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">👨‍⚕️</span>
            <span>AI Doctor Consultation</span>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
              Voice + Text in All Indian Languages
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Apni bhasha me bolein ya likhein — AI Doctor samne se bol kar dawaiyan (medicines), aaram ka tarika aur parhez samjhayenge.
          </p>
        </div>

        {/* Multi-language Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">🌐 Language:</span>
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value)
              handleReset()
            }}
            className="input text-xs font-bold text-teal-900 border-teal-300 py-1.5 px-3 min-w-[160px] bg-teal-50/50 shadow-xs"
          >
            {Object.entries(SUPPORTED_LANGS).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Critical Emergency Banner */}
      {result?.is_emergency && (
        <div className="flex items-start gap-4 rounded-2xl border-2 border-red-600 bg-red-600 p-5 text-white shadow-lg animate-pulse">
          <div className="text-4xl shrink-0">🚨</div>
          <div className="flex-1">
            <div className="font-bold text-xl tracking-tight">CRITICAL MEDICAL EMERGENCY</div>
            <p className="mt-1 text-sm text-red-100 leading-relaxed">{result.emergency_warning}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => speakAsDoctor(result.emergency_warning, lang)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
              >
                🔊 {isSpeaking ? 'Speaking Warning...' : 'Listen Warning Again'}
              </button>
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopDoctorSpeech}
                  className="rounded-lg bg-black/30 px-3 py-1.5 text-xs font-semibold hover:bg-black/40"
                >
                  ⏹️ Stop
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complete Doctor Consultation Result Panel */}
      {result && !result.is_emergency && (
        <div className="space-y-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/60 via-white to-cyan-50/40 p-5 shadow-sm">
          {/* Top Interactive Doctor Voice Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-all shadow-md ${
                    isSpeaking
                      ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white ring-4 ring-teal-200 animate-pulse'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  👨‍⚕️
                </div>
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">Dr. MediCase AI</span>
                  {isSpeaking ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Speaking Consultation...
                    </span>
                  ) : isPaused ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Paused
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      Doctor Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {SUPPORTED_LANGS[lang]?.name} Consultation Voice
                </p>
              </div>
            </div>

            {/* Speaking Wave & Voice Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {isSpeaking && (
                <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200 mr-1">
                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="w-1 h-5 bg-emerald-600 rounded-full animate-bounce" />
                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="w-1 h-6 bg-emerald-700 rounded-full animate-bounce" />
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              )}

              {!isSpeaking ? (
                <button
                  type="button"
                  onClick={() => speakAsDoctor(result.spoken_summary || result.humanized_response, lang)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-all"
                >
                  <span>🔊</span>
                  <span>Listen to Doctor Voice</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={togglePauseSpeech}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-100 border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-200"
                  >
                    <span>{isPaused ? '▶️ Resume' : '⏸️ Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopDoctorSpeech}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-100 border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                  >
                    <span>⏹️ Stop</span>
                  </button>
                </>
              )}

              <select
                value={speechSpeed}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setSpeechSpeed(val)
                  if (audioRef.current) audioRef.current.playbackRate = val
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600 focus:outline-none"
              >
                <option value="0.85">0.85x Calm Doctor</option>
                <option value="0.92">0.92x Normal</option>
                <option value="1.0">1.0x Standard</option>
              </select>
            </div>
          </div>

          {/* Detected Symptoms Chips */}
          {result.detected_symptoms?.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                🩺 Detected Symptoms
              </div>
              <div className="flex flex-wrap gap-2">
                {result.detected_symptoms.map((sym) => (
                  <span
                    key={sym}
                    className="rounded-full bg-teal-100 border border-teal-300 px-3 py-1 text-xs font-medium text-teal-800 shadow-xs"
                  >
                    {sym.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Doctor's Primary Consultation Explanation */}
          <div className="rounded-2xl bg-white border border-teal-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <span className="text-xl">🩺</span>
                <span>Doctor Consultation Analysis</span>
              </div>
              {isSpeaking && (
                <span className="text-xs text-emerald-600 font-medium animate-pulse flex items-center gap-1">
                  <span>🔊</span> Doctor is speaking to you now
                </span>
              )}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {result.humanized_response}
            </p>
          </div>

          {/* SECTION 1: Suggested First-Aid / Relief Medicines */}
          {result.suggested_medicines?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="text-lg">💊</span>
                  <span>Suggested First-Aid & Symptomatic Medicines (प्राथमिक राहत दवाइयाँ)</span>
                </h3>
                <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  OTC Safe Recommendations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {result.suggested_medicines.map((med, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-teal-200 bg-white p-4 shadow-sm hover:border-teal-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-teal-500" />
                          {med.name}
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="text-xs text-slate-600 mb-2">
                        <span className="font-semibold text-slate-700">🎯 Purpose:</span> {med.purpose}
                      </div>

                      {/* How it helps relief */}
                      <div className="rounded-xl bg-teal-50/70 border border-teal-100 p-2.5 text-xs text-teal-900 mb-2">
                        <span className="font-bold text-teal-800">⚡ इससे कैसे आराम मिलेगा:</span> {med.relief_explanation}
                      </div>
                    </div>

                    {/* Dosage Instructions */}
                    <div className="mt-1 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="font-bold text-slate-700 shrink-0">🕒 Timing & Dosage:</span>
                      <span>{med.dosage_instruction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: Precautions (Do's, Don'ts & Diet) */}
          {result.precautions?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <span>Precautions & Care to Follow (परहेज और सावधानियां)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.precautions.map((prec, i) => {
                  const cat = (prec.category || '').toUpperCase()
                  const isDo = cat.includes('DO') && !cat.includes('DONT')
                  const isDont = cat.includes('DONT') || cat.includes("DON'T")
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border p-3 text-xs shadow-xs ${
                        isDo
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : isDont
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-amber-50/70 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                        <span>{isDo ? '✅ क्या करें (Do)' : isDont ? '🚫 क्या न करें (Don\'t)' : '🥗 खानपान (Diet)'}</span>
                      </div>
                      <p className="leading-relaxed">{prec.instruction}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: Diet & Lifestyle Tips & Doctor Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.diet_lifestyle_tips?.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🥣</span> Recommended Diet & Hydration
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {result.diet_lifestyle_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommended_immediate_advice?.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>🩺</span> When to Rush to a Doctor / Hospital
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {result.recommended_immediate_advice.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">⚠️</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Medical Disclaimer */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
            <strong>Medical Safety Note:</strong> {result.disclaimer || 'Yeh ek prathmik (first-aid / OTC) sujhav hai. Gambhir sthiti mein turant certified doctor se milen.'}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => speakAsDoctor(result.spoken_summary || result.humanized_response, lang)}
              className="btn-outline flex-1 text-sm py-2.5 font-semibold"
            >
              🔄 Listen to Doctor Again
            </button>
            <button
              onClick={handleReset}
              className="btn flex-1 text-sm py-2.5 shadow-sm font-semibold"
            >
              💬 Describe Another Problem
            </button>
          </div>
        </div>
      )}

      {/* Input Form */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">Age (optional)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="label text-xs">Gender (optional)</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input text-sm"
              >
                <option value="">Not specified</option>
                <option value="MALE">Male (पुरुष)</option>
                <option value="FEMALE">Female (महिला)</option>
              </select>
            </div>
          </div>

          {/* Main Symptom Textarea */}
          <div>
            <div className="relative">
              <textarea
                value={text + (interimText ? ' ' + interimText : '')}
                onChange={(e) => {
                  setText(e.target.value)
                  setInterimText('')
                }}
                placeholder={SUPPORTED_LANGS[lang]?.placeholder || 'Apni pareshani yahan likhein ya bolen...'}
                rows={4}
                className={`w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 resize-none transition-all shadow-sm ${
                  listening
                    ? 'border-red-400 ring-2 ring-red-300 ring-opacity-50'
                    : 'border-slate-300 focus:border-teal-500 focus:ring-teal-400'
                }`}
              />
              {listening && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-full shadow-xs">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-[11px] text-red-600 font-semibold">Listening to you...</span>
                </div>
              )}
            </div>

            {/* Voice Input Controls */}
            <div className="mt-3 flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {!listening ? (
                  <button
                    type="button"
                    onClick={startVoice}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-all shadow-xs"
                  >
                    <span className="text-base">🎙️</span> Start Speaking (बोलना शुरू करें)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoice}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-all animate-pulse shadow-sm"
                  >
                    <span className="text-base">⏹️</span> Stop Speaking
                  </button>
                )}

                {text && (
                  <button
                    type="button"
                    onClick={() => {
                      setText('')
                      setInterimText('')
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-teal-800 font-medium cursor-pointer bg-teal-50/80 border border-teal-200 px-3 py-1.5 rounded-xl">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
                />
                <span>🔊 Doctor automatically speaks response</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (!text.trim() && !interimText.trim())}
            className="btn w-full py-3 text-sm font-semibold disabled:opacity-50 shadow-md shadow-teal-700/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Gemini AI Doctor Analyzing Symptoms & Preparing Advice...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🩺</span>
                <span>Get Doctor Diagnosis, Medicines & Voice Consultation →</span>
              </span>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            🔒 Safe & Private: No personal health records are shared with third parties.
          </p>
        </form>
      )}
    </div>
  )
}
