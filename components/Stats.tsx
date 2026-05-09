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
        style={{
          padding: '16px 18px',
          borderRadius: 12,
          background: 'var(--mm-card-bg, rgba(120,120,140,0.06))',
          border: '1px solid var(--mm-card-bd, rgba(120,120,140,0.18))'
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</div>
        <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{s.label}</div>
        {s.sub && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{s.sub}</div>}
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
        style={{
          display: 'block',
          padding: '14px 16px',
          borderRadius: 10,
          textDecoration: 'none',
          color: 'inherit',
          background: 'rgba(120,120,140,0.04)',
          border: '1px solid rgba(120,120,140,0.18)',
          transition: 'all 0.15s'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</span>
          {c.count != null && (
            <span style={{ fontSize: 12, opacity: 0.55 }}>{c.count}</span>
          )}
        </div>
        {c.desc && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{c.desc}</div>}
      </a>
    ))}
  </div>
)
