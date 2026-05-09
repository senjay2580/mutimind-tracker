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
  subcategory?: string
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

const isGithub = (url: string) => /^https:\/\/github\.com\//.test(url)

const hostnameOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

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
  const gh = isGithub(repo.url)
  let shortPath = ''
  try {
    shortPath = gh
      ? repo.url.replace(/^https:\/\//, '')
      : hostnameOf(repo.url) + new URL(repo.url).pathname.replace(/\/$/, '')
  } catch {
    shortPath = repo.url
  }

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
          {!gh && !stars && <span className="mm-meta-site">站点</span>}
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
        {repo.owner && gh && (
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

function groupBySub(items: Repo[]): { sub: string; items: Repo[] }[] {
  const groups: { sub: string; items: Repo[] }[] = []
  for (const r of items) {
    const sub = r.subcategory || ''
    const last = groups[groups.length - 1]
    if (last && last.sub === sub) last.items.push(r)
    else groups.push({ sub, items: [r] })
  }
  return groups
}

export const RepoList: React.FC<{ slug: string }> = ({ slug }) => {
  const items = (repos as Repo[]).filter((r) => r.slug === slug)
  const groups = groupBySub(items)
  const hasSubs = groups.some((g) => g.sub)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (!items.length) {
    return (
      <div className="mm-repo-fallback">
        <span className="mm-repo-fallback-label">本分类为非标准项目，下方为原始内容：</span>
      </div>
    )
  }

  const toggleAll = (collapse: boolean) => {
    if (!hasSubs) return
    const next: Record<string, boolean> = {}
    for (const g of groups) if (g.sub) next[g.sub] = collapse
    setCollapsed(next)
  }

  if (!hasSubs) {
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

  let runningIdx = 0
  return (
    <>
      <div className="mm-repo-summary">
        共 <strong>{items.length}</strong> 项 · 分 <strong>{groups.length}</strong> 组
      </div>
      <div className="mm-repo-group-toolbar">
        <button type="button" onClick={() => toggleAll(false)}>
          全部展开
        </button>
        <button type="button" onClick={() => toggleAll(true)}>
          全部收起
        </button>
      </div>
      {groups.map((g, gi) => {
        const isCollapsed = !!collapsed[g.sub]
        return (
          <section key={gi} className="mm-repo-group">
            {g.sub && (
              <button
                type="button"
                className="mm-repo-group-header"
                aria-expanded={!isCollapsed}
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [g.sub]: !c[g.sub] }))
                }
              >
                <span>{g.sub}</span>
                <span className="mm-repo-group-count">{g.items.length}</span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.4}
                  className="mm-repo-group-chevron"
                />
              </button>
            )}
            <div className={`mm-repo-group-body ${isCollapsed ? 'is-collapsed' : ''}`}>
              <div>
                <div className="mm-repo-flow">
                  {g.items.map((r) => {
                    runningIdx += 1
                    return <RepoItem key={r.url} repo={r} index={runningIdx} />
                  })}
                </div>
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}

export default RepoList
