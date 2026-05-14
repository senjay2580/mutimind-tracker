import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Search, ExternalLink, Star, X } from 'lucide-react'
import repos from '../lib/repos.json'

type Repo = {
  name: string
  owner: string
  url: string
  stars: number | null
  lang: string | null
  category: string
  subcategory?: string
  slug: string
  description: string
  anchor?: string
}

const MAX_HITS = 8

// Token + n-gram extraction, mirrors /api/search so what users see in the
// dropdown matches the public API ranking exactly.
function tokenize(q: string): Set<string> {
  const needle = q.toLowerCase().trim()
  const grams = new Set<string>()
  for (let i = 0; i < needle.length - 1; i++) {
    const g2 = needle.slice(i, i + 2).trim()
    if (g2.length === 2) grams.add(g2)
    const g3 = needle.slice(i, i + 3).trim()
    if (g3.length === 3) grams.add(g3)
  }
  for (const t of needle.split(/[\s,，。、；;:：!！?？()（）]+/)) {
    if (t.length >= 2) grams.add(t)
  }
  return grams
}

type Scored = { r: Repo; score: number }

function search(q: string): Scored[] {
  if (!q || q.trim().length < 1) return []
  const grams = tokenize(q)
  if (grams.size === 0) return []
  const all = repos as Repo[]
  const out: Scored[] = []
  for (const r of all) {
    const name = (r.name || '').toLowerCase()
    const owner = (r.owner || '').toLowerCase()
    const cat = (r.category || '').toLowerCase()
    const sub = (r.subcategory || '').toLowerCase()
    const desc = (r.description || '').toLowerCase()
    const hay = `${name} ${owner} ${cat} ${sub} ${desc}`
    let score = 0
    for (const g of grams) {
      if (!hay.includes(g)) continue
      score += 1
      if (name.includes(g)) score += 5
      if (owner.includes(g)) score += 4
      if (cat.includes(g)) score += 2
      if (sub.includes(g)) score += 2
    }
    if (score > 0) out.push({ r, score })
  }
  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const sa = a.r.stars ?? 0
    const sb = b.r.stars ?? 0
    return sb - sa
  })
  return out.slice(0, MAX_HITS)
}

const fmtStars = (n: number | null): string | null => {
  if (n == null) return null
  if (n >= 10000) return `${(n / 1000).toFixed(0)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// Highlight matched substring (case-insensitive, first match only per gram)
function highlight(text: string, grams: string[]): React.ReactNode {
  if (!text || grams.length === 0) return text
  const positions: { start: number; end: number }[] = []
  const lower = text.toLowerCase()
  for (const g of grams) {
    if (g.length < 2) continue
    let idx = lower.indexOf(g)
    while (idx >= 0) {
      positions.push({ start: idx, end: idx + g.length })
      idx = lower.indexOf(g, idx + 1)
    }
  }
  if (positions.length === 0) return text
  positions.sort((a, b) => a.start - b.start)
  const merged: { start: number; end: number }[] = []
  for (const p of positions) {
    const last = merged[merged.length - 1]
    if (last && p.start <= last.end) last.end = Math.max(last.end, p.end)
    else merged.push({ ...p })
  }
  const parts: React.ReactNode[] = []
  let cur = 0
  for (const p of merged) {
    if (cur < p.start) parts.push(text.slice(cur, p.start))
    parts.push(
      <mark key={p.start} className="mm-search-hl">
        {text.slice(p.start, p.end)}
      </mark>
    )
    cur = p.end
  }
  if (cur < text.length) parts.push(text.slice(cur))
  return <>{parts}</>
}

export const RepoSearch: React.FC = () => {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const hits = useMemo(() => search(q), [q])
  const gramList = useMemo(() => Array.from(tokenize(q)), [q])

  // Global "/" focuses search (skip when typing in another input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null
      const inField =
        tgt &&
        (tgt.tagName === 'INPUT' ||
          tgt.tagName === 'TEXTAREA' ||
          tgt.isContentEditable)
      if (e.key === '/' && !inField) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Click outside → close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current) return
      if (!boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    setCursor(0)
  }, [q])

  const navigateTo = useCallback(
    (r: Repo, openExternal: boolean) => {
      if (openExternal) {
        window.open(r.url, '_blank', 'noopener,noreferrer')
        return
      }
      const path = `/tracker/${r.slug}#${r.anchor || ''}`
      setOpen(false)
      setQ('')
      router.push(path)
    },
    [router]
  )

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!hits.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (c + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const pick = hits[cursor]
      if (pick) navigateTo(pick.r, e.metaKey || e.ctrlKey)
    }
  }

  return (
    <div className="mm-search" ref={boxRef}>
      <div className="mm-search-input-wrap">
        <Search size={14} strokeWidth={2.2} className="mm-search-icon" />
        <input
          ref={inputRef}
          className="mm-search-input"
          type="text"
          spellCheck={false}
          autoComplete="off"
          placeholder="搜索项目 / 关键词 / 作者…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {q && (
          <button
            type="button"
            className="mm-search-clear"
            onClick={() => {
              setQ('')
              inputRef.current?.focus()
            }}
            aria-label="清空"
          >
            <X size={12} strokeWidth={2.4} />
          </button>
        )}
        <kbd className="mm-search-kbd">/</kbd>
      </div>

      {open && q.trim().length >= 1 && (
        <div className="mm-search-panel" role="listbox">
          {hits.length === 0 ? (
            <div className="mm-search-empty">
              没有匹配的项目 ·{' '}
              <span className="mm-search-empty-hint">试试更短的关键词或作者名</span>
            </div>
          ) : (
            <>
              {hits.map(({ r }, i) => {
                const stars = fmtStars(r.stars)
                const active = i === cursor
                return (
                  <button
                    type="button"
                    key={r.url}
                    role="option"
                    aria-selected={active}
                    className={`mm-search-item ${active ? 'is-active' : ''}`}
                    onMouseEnter={() => setCursor(i)}
                    onClick={(e) =>
                      navigateTo(r, e.metaKey || e.ctrlKey)
                    }
                  >
                    <div className="mm-search-item-head">
                      <span className="mm-search-item-name">
                        {highlight(r.name, gramList)}
                      </span>
                      {stars && (
                        <span className="mm-search-item-stars">
                          <Star size={10} strokeWidth={2.4} fill="currentColor" />
                          {stars}
                        </span>
                      )}
                    </div>
                    <div className="mm-search-item-meta">
                      {r.owner && (
                        <span className="mm-search-item-owner">
                          @{highlight(r.owner, gramList)}
                        </span>
                      )}
                      <span className="mm-search-item-cat">{r.category}</span>
                      {r.subcategory && (
                        <span className="mm-search-item-sub">· {r.subcategory}</span>
                      )}
                    </div>
                    {r.description && (
                      <div className="mm-search-item-desc">
                        {highlight(r.description.slice(0, 140), gramList)}
                        {r.description.length > 140 && '…'}
                      </div>
                    )}
                  </button>
                )
              })}
              <div className="mm-search-foot">
                <span>
                  <kbd>↑</kbd> <kbd>↓</kbd> 导航
                </span>
                <span>
                  <kbd>↵</kbd> 跳转卡片
                </span>
                <span>
                  <kbd>Ctrl</kbd>+<kbd>↵</kbd> 打开 <ExternalLink size={10} />
                </span>
                <span>
                  <kbd>Esc</kbd> 关闭
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default RepoSearch
