import React from 'react'
import { Star, Clock, Code2, Scale, ExternalLink, ArrowUpRight, User } from 'lucide-react'
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

const fmtDate = (d: string | null) => {
  if (!d) return null
  // Show YYYY-MM for compactness
  return d.length >= 7 ? d.slice(0, 7) : d
}

const langTone: Record<string, string> = {
  Python: '#3b82f6',
  TypeScript: '#38bdf8',
  JavaScript: '#facc15',
  Rust: '#fb923c',
  Go: '#22d3ee',
  Java: '#fb7185',
  'C++': '#a78bfa',
  Shell: '#34d399'
}

const RepoCard: React.FC<{ repo: Repo; index: number }> = ({ repo, index }) => {
  const stars = fmtStars(repo.stars)
  const date = fmtDate(repo.updated)
  return (
    <article className="mm-repo-card" data-has-stars={!!stars}>
      <div className="mm-repo-num">{String(index).padStart(2, '0')}</div>

      <header className="mm-repo-head">
        <h3 className="mm-repo-title">
          <a href={repo.url} target="_blank" rel="noreferrer">
            {repo.name}
          </a>
        </h3>
        {repo.owner && (
          <div className="mm-repo-owner">
            <User size={11} strokeWidth={2.4} />
            <span>{repo.owner}</span>
          </div>
        )}
      </header>

      <p className="mm-repo-desc">{repo.description || '（暂无描述）'}</p>

      <div className="mm-repo-meta">
        {stars && (
          <span className="mm-repo-pill mm-pill-star">
            <Star size={11} strokeWidth={2.4} fill="currentColor" />
            {stars}
          </span>
        )}
        {date && (
          <span className="mm-repo-pill mm-pill-date">
            <Clock size={11} strokeWidth={2.4} />
            {date}
          </span>
        )}
        {repo.lang && (
          <span
            className="mm-repo-pill mm-pill-lang"
            style={{ color: langTone[repo.lang] || '#38bdf8' }}
          >
            <Code2 size={11} strokeWidth={2.4} />
            {repo.lang}
          </span>
        )}
        {repo.license && (
          <span className="mm-repo-pill mm-pill-license">
            <Scale size={11} strokeWidth={2.4} />
            {repo.license}
          </span>
        )}
      </div>

      <a className="mm-repo-link" href={repo.url} target="_blank" rel="noreferrer">
        <ExternalLink size={12} strokeWidth={2.4} />
        <span>查看仓库</span>
        <ArrowUpRight size={12} strokeWidth={2.4} className="mm-repo-link-arrow" />
      </a>
    </article>
  )
}

export const RepoList: React.FC<{ slug: string }> = ({ slug }) => {
  const items = (repos as Repo[]).filter((r) => r.slug === slug)
  if (!items.length) {
    return <div className="mm-repo-empty">暂无项目，使用 github-tracker skill 添加。</div>
  }
  return (
    <div className="mm-repo-grid">
      {items.map((r, i) => (
        <RepoCard key={r.url} repo={r} index={i + 1} />
      ))}
    </div>
  )
}

export default RepoList
