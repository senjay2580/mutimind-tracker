import React from 'react'
import type { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
      MutiMind <span style={{ opacity: 0.55, fontWeight: 400 }}>· 优质开源追踪</span>
    </span>
  ),
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
    backToTop: true
  },
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
    </>
  )
}

export default config
