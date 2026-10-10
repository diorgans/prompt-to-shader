import { useEffect, useState } from 'react'
import { Gallery } from './Gallery'
import { Studio } from './Studio'
import { Trailer } from './Trailer'

function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (hash === '#gallery') return <Gallery />
  if (hash === '#trailer') return <Trailer />
  return <Studio />
}

export default App
