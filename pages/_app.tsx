import type { AppProps } from 'next/app'
import { useEffect, type ReactElement } from 'react'
import '../styles/globals.css'

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

  return <Component {...pageProps} />
}
