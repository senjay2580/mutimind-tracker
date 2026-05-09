import React from 'react'

type Props = {
  url: string
  stars?: number | string
  updated?: string
  lang?: string
  license?: string
  tags?: string[]
}

const fmtStars = (n: number | string | undefined) => {
  if (n == null || n === '') return null
  const num = typeof n === 'number' ? n : Number(String(n).replace(/[, ]/g, ''))
  if (!Number.isFinite(num)) return String(n)
  if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'k'
  return String(num)
}

const Pill: React.FC<{ children: React.ReactNode; tone?: string }> = ({ children, tone = 'default' }) => {
  const tones: Record<string, { bg: string; fg: string; bd: string }> = {
    default: { bg: 'rgba(120,120,140,0.1)', fg: 'inherit', bd: 'rgba(120,120,140,0.25)' },
    star:    { bg: 'rgba(234,179,8,0.12)', fg: '#eab308', bd: 'rgba(234,179,8,0.35)' },
    lang:    { bg: 'rgba(56,189,248,0.10)', fg: '#38bdf8', bd: 'rgba(56,189,248,0.30)' },
    date:    { bg: 'rgba(34,197,94,0.10)', fg: '#22c55e', bd: 'rgba(34,197,94,0.30)' },
    license: { bg: 'rgba(168,85,247,0.10)', fg: '#a855f7', bd: 'rgba(168,85,247,0.30)' }
  }
  const t = tones[tone] || tones.default
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        lineHeight: '18px',
        fontWeight: 500,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  )
}

export const RepoMeta: React.FC<Props> = ({ url, stars, updated, lang, license, tags }) => {
  const stars_ = fmtStars(stars)
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        margin: '6px 0 12px',
        alignItems: 'center'
      }}
    >
      {url && (
        <Pill>
          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            ↗ GitHub
          </a>
        </Pill>
      )}
      {stars_ && <Pill tone="star">★ {stars_}</Pill>}
      {updated && <Pill tone="date">⟳ {updated}</Pill>}
      {lang && <Pill tone="lang">{lang}</Pill>}
      {license && <Pill tone="license">{license}</Pill>}
      {tags?.map((t) => (
        <Pill key={t}>#{t}</Pill>
      ))}
    </div>
  )
}

export default RepoMeta
