import React, { useState } from 'react'
import { ChevronDown, ArrowUpRight, Boxes, Sparkles, Layers } from 'lucide-react'
import repos from '../lib/repos.json'
import CategoryWiki from './CategoryWiki'

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
  addedAt?: string
}

const NEW_WINDOW_MS = 24 * 60 * 60 * 1000
const isNew = (addedAt?: string) =>
  !!addedAt && Date.now() - new Date(addedAt).getTime() < NEW_WINDOW_MS

const fmtStars = (n: number | null) => {
  if (n == null) return null
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const fmtDate = (d: string | null) => (d && d.length >= 7 ? d.slice(0, 7) : null)

const isGithub = (url: string) => /^https:\/\/github\.com\//.test(url)

export const anchorOf = (slug: string, url: string): string => {
  const path = url
    .replace(/^https?:\/\//, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug}__${path}`
}

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

  const fresh = isNew(repo.addedAt)

  return (
    <article
      id={anchorOf(repo.slug, repo.url)}
      className={`mm-repo-item ${open ? 'is-open' : ''} ${fresh ? 'is-new' : ''}`}
    >
      {fresh && <span className="mm-repo-new" title={`Added ${repo.addedAt}`}>NEW</span>}
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

  const newCount = items.filter((r) => isNew(r.addedAt)).length

  if (!hasSubs) {
    return (
      <>
        <div className="mm-repo-summary">
          <span className="mm-summary-stat" title="收录项目总数">
            <Boxes size={13} strokeWidth={2.2} />
            <strong>{items.length}</strong>
          </span>
          {newCount > 0 && (
            <span className="mm-summary-stat mm-summary-stat-new" title="24h 内新增">
              <Sparkles size={13} strokeWidth={2.2} />
              <strong>{newCount}</strong>
            </span>
          )}
          <span className="mm-summary-sort">按 stars 降序</span>
        </div>
        <CategoryWiki slug={slug} itemCount={items.length} />
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
        <span className="mm-summary-stat" title="收录项目总数">
          <Boxes size={13} strokeWidth={2.2} />
          <strong>{items.length}</strong>
        </span>
        <span className="mm-summary-stat" title="子分组数">
          <Layers size={13} strokeWidth={2.2} />
          <strong>{groups.length}</strong>
        </span>
        {newCount > 0 && (
          <span className="mm-summary-stat mm-summary-stat-new" title="24h 内新增">
            <Sparkles size={13} strokeWidth={2.2} />
            <strong>{newCount}</strong>
          </span>
        )}
      </div>
      <CategoryWiki slug={slug} itemCount={items.length} />
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
