import { useEffect, useState } from 'react'

// Read text aloud with the browser's built-in speech synthesis (on-device,
// free, nothing sent anywhere). Returns null where the browser can't speak.
export function useReadAloud(text: string) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const [speaking, setSpeaking] = useState(false)

  // A new scene means new text: stop reading the old one.
  useEffect(() => {
    synth?.cancel()
    setSpeaking(false)
  }, [text, synth])
  useEffect(() => () => synth?.cancel(), [synth])

  if (!synth) return null
  return {
    speaking,
    toggle() {
      if (speaking) {
        synth.cancel()
        setSpeaking(false)
        return
      }
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      const voice = synth.getVoices().find((v) => v.lang === 'en-US' && v.localService)
      if (voice) u.voice = voice
      u.onend = u.onerror = () => setSpeaking(false)
      synth.speak(u)
      setSpeaking(true)
    },
  }
}
