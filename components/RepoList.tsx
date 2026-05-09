import React, { useState } from 'react'
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import repos from '../lib/repos.json'

type Repo = {
  name: string
  owner: string
  url: string
  stars: number | null
  updated: string | null
  lang: string | null
  license: string | null
  category: string
  slug: string
  description: string
}

const fmtStars = (n: number | null) => {
  if (n == null) return null
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const fmtDate = (d: string | null) => (d && d.length >= 7 ? d.slice(0, 7) : null)

// Split description into a punchy "headline" (first sentence) + remainder for "详情"
function splitDesc(desc: string): { headline: string; detail: string } {
  if (!desc) return { headline: '', detail: '' }
  const trimmed = desc.replace(/\s+/g, ' ').trim()
  const m = trimmed.match(/^(.{8,160}?[—。·\.!！?？:：])\s*(.*)$/)
  if (m) return { headline: m[1].trim(), detail: m[2].trim() }
  if (trimmed.length <= 140) return { headline: trimmed, detail: '' }
  const cut = trimmed.lastIndexOf(' ', 150)
  const at = cut > 80 ? cut : 140
  return { headline: trimmed.slice(0, at).trim(), detail: trimmed.slice(at).trim() }
}

const RepoItem: React.FC<{ repo: Repo; index: number }> = ({ repo, index }) => {
  const [open, setOpen] = useState(false)
  const stars = fmtStars(repo.stars)
  const date = fmtDate(repo.updated)
  const { headline, detail } = splitDesc(repo.description || '')
  const hasDetail = detail.length > 0
  const shortPath = repo.url.replace(/^https:\/\//, '')

  return (
    <article className={`mm-repo-item ${open ? 'is-open' : ''}`}>
      <div className="mm-repo-row">
        <span className="mm-repo-num">{String(index).padStart(2, '0')}</span>
        <h3 className="mm-repo-name">
          <a href={repo.url} target="_blank" rel="noreferrer">
            {repo.name}
          </a>
        </h3>
        <div className="mm-repo-meta">
          {stars && <span className="mm-meta-star">★ {stars}</span>}
          {date && <span className="mm-meta-date">⟳ {date}</span>}
          {repo.lang && <span className="mm-meta-lang">{repo.lang}</span>}
          {repo.license && <span className="mm-meta-license">{repo.license}</span>}
        </div>
      </div>

      <p className="mm-repo-desc">
        {headline || <span className="mm-repo-empty-inline">（暂无简介）</span>}
      </p>

      {hasDetail && (
        <div className={`mm-repo-detail-wrap ${open ? 'is-open' : ''}`}>
          <div className="mm-repo-detail-body">{detail}</div>
        </div>
      )}

      <div className="mm-repo-foot">
        {repo.owner && (
          <>
            <a
              href={`https://github.com/${repo.owner}`}
              target="_blank"
              rel="noreferrer"
              className="mm-repo-author"
            >
              @{repo.owner}
            </a>
            <span className="mm-repo-foot-sep">·</span>
          </>
        )}
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="mm-repo-foot-link"
        >
          {shortPath}
          <ArrowUpRight size={11} strokeWidth={2.4} />
        </a>
        {hasDetail && (
          <button
            type="button"
            className="mm-repo-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? '收起' : '详情'}
            <ChevronDown
              size={11}
              strokeWidth={2.4}
              style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s'
              }}
            />
          </button>
        )}
      </div>
    </article>
  )
}

export const RepoList: React.FC<{ slug: string }> = ({ slug }) => {
  const items = (repos as Repo[]).filter((r) => r.slug === slug)
  if (!items.length) {
    // Empty state. The CSS rule `.mm-repo-fallback ~ .mm-source-data` will reveal
    // the original mdx content as a fallback (used by sections like free-apis-index
    // where entries are not GitHub repos and therefore not indexable).
    return (
      <div className="mm-repo-fallback">
        <span className="mm-repo-fallback-label">本分类为非标准 GitHub 项目，下方为原始内容：</span>
      </div>
    )
  }
  return (
    <>
      <div className="mm-repo-summary">
        共 <strong>{items.length}</strong> 项 · 按 stars 降序
      </div>
      <div className="mm-repo-flow">
        {items.map((r, i) => (
          <RepoItem key={r.url} repo={r} index={i + 1} />
        ))}
      </div>
    </>
  )
}

export default RepoList
