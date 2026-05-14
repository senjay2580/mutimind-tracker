import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'
import { Compass } from 'lucide-react'
import RepoSearch from './components/RepoSearch'

const Logo = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        borderRadius: 9,
        background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
        boxShadow:
          '0 0 0 1px rgba(96, 165, 250, 0.35), 0 6px 18px -4px rgba(59, 130, 246, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      }}
    >
      <Compass size={18} color="#ffffff" strokeWidth={2.2} />
    </span>
    <span style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: 16 }}>
      MutiMind{' '}
      <span style={{ opacity: 0.55, fontWeight: 400 }}>· 优质开源追踪</span>
    </span>
  </span>
)

const config: DocsThemeConfig = {
  logo: <Logo />,
  project: {
    link: 'https://github.com/senjay2580/mutimind-tracker'
  },
  docsRepositoryBase: 'https://github.com/senjay2580/mutimind-tracker/blob/main',
  footer: {
    content: (
      <span style={{ opacity: 0.7 }}>
        MutiMind © {new Date().getFullYear()} · 由 github-tracker skill 自动维护
      </span>
    )
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true
  },
  toc: {
    backToTop: true,
    float: false
  },
  main: ({ children }) => (
    <div style={{ maxWidth: '100%', width: '100%' }}>{children}</div>
  ),
  search: {
    component: <RepoSearch />
  },
  feedback: { content: null },
  editLink: { content: '编辑此页 →' },
  darkMode: true,
  nextThemes: { defaultTheme: 'dark' },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="MutiMind - 优质开源项目追踪" />
      <meta property="og:description" content="精选 GitHub AI/Agent/RAG/具身智能开源项目，按分类持续追踪。" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="MutiMind" />
      <meta name="application-name" content="MutiMind" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </>
  )
}

export default config
