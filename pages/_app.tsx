import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { useEffect, type ReactElement } from 'react'
import '../styles/globals.css'
import '../styles/ask.css'

// AskFab is client-only (uses fetch + window) — disable SSR
const AskFab = dynamic(() => import('../components/AskFab'), { ssr: false })

export default function App({ Component, pageProps }: AppProps): ReactElement {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.location.protocol === 'https:'
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <>
      <Component {...pageProps} />
      <AskFab />
    </>
  )
}
