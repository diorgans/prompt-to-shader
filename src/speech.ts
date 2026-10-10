import { useEffect, useState } from 'react'

// Read text aloud with the browser's built-in speech synthesis (on-device,
// free, nothing sent anywhere). Returns null where the browser can't speak.
export function useReadAloud(text: string) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  // The text currently being read; a different scene's text means "not reading this one".
  const [reading, setReading] = useState<string>()
  const speaking = reading === text

  // A new scene means new text: stop reading the old one.
  useEffect(() => {
    synth?.cancel()
  }, [text, synth])
  useEffect(() => () => synth?.cancel(), [synth])

  if (!synth) return null
  return {
    speaking,
    toggle() {
      synth.cancel()
      if (speaking) {
        setReading(undefined)
        return
      }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      const voice = synth.getVoices().find((v) => v.lang === 'en-US' && v.localService)
      if (voice) u.voice = voice
      u.onend = u.onerror = () => setReading((r) => (r === text ? undefined : r))
      synth.speak(u)
      setReading(text)
    },
  }
}
