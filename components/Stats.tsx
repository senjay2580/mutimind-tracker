import React from 'react'

type Stat = { label: string; value: string | number; sub?: string }

export const Stats: React.FC<{ items: Stat[] }> = ({ items }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12,
      margin: '20px 0 28px'
    }}
  >
    {items.map((s) => (
      <div
        key={s.label}
        className="mm-stat-card"
        style={{
          padding: '16px 18px',
          borderRadius: 14,
          background:
            'linear-gradient(160deg, rgba(59,130,246,0.10), rgba(59,130,246,0.02))',
          border: '1px solid rgba(59,130,246,0.22)',
          boxShadow:
            '0 0 0 1px rgba(59,130,246,0.05), 0 8px 22px -14px rgba(96,165,250,0.45)',
          transition: 'all 0.22s ease'
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #93c5fd, #2563eb)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.02em',
            filter: 'drop-shadow(0 0 12px rgba(96,165,250,0.45))'
          }}
        >
          {s.value}
        </div>
        <div style={{ fontSize: 13, opacity: 0.72, marginTop: 6 }}>{s.label}</div>
        {s.sub && (
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{s.sub}</div>
        )}
      </div>
    ))}
  </div>
)

type Card = { title: string; href: string; desc?: string; count?: number }

export const CategoryGrid: React.FC<{ items: Card[] }> = ({ items }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 12,
      margin: '12px 0 28px'
    }}
  >
    {items.map((c) => (
      <a
        key={c.href}
        href={c.href}
        className="mm-cat-card"
        style={{
          display: 'block',
          padding: '14px 16px',
          borderRadius: 12,
          textDecoration: 'none',
          color: 'inherit',
          background: 'rgba(59,130,246,0.04)',
          border: '1px solid rgba(59,130,246,0.18)',
          boxShadow:
            '0 0 0 1px rgba(59,130,246,0.04), 0 6px 18px -14px rgba(96,165,250,0.35)',
          transition: 'all 0.20s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline'
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</span>
          {c.count != null && (
            <span style={{ fontSize: 12, opacity: 0.55 }}>{c.count}</span>
          )}
        </div>
        {c.desc && (
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{c.desc}</div>
        )}
      </a>
    ))}
  </div>
)
