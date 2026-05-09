import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'

const Logo = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="mm-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#mm-logo-g)" />
      <path
        d="M 8 22 L 8 10 L 13 16 L 16 12 L 19 16 L 24 10 L 24 22"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <g fill="#ffffff">
        <circle cx="8" cy="10" r="1.6" />
        <circle cx="16" cy="12" r="1.6" />
        <circle cx="24" cy="10" r="1.6" />
      </g>
    </svg>
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
    placeholder: '搜索项目 / 关键词 / 作者…'
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
      <meta name="theme-color" content="#10b981" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/logo.svg" />
    </>
  )
}

export default config
