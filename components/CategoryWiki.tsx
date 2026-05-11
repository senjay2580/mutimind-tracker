import React, { useEffect, useState } from 'react'
import { Sparkles, Loader2, RefreshCcw, X, ChevronDown } from 'lucide-react'
import { marked } from 'marked'

type Props = { slug: string; itemCount: number }

const cacheKey = (slug: string) => `mm-cat-wiki:${slug}`

type Cached = { wiki: string; generatedAt: number }

const readCache = (slug: string): Cached | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(cacheKey(slug))
    if (!raw) return null
    const c = JSON.parse(raw) as Cached
    if (!c?.wiki || !c?.generatedAt) return null
    return c
  } catch {
    return null
  }
}

const writeCache = (slug: string, wiki: string) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      cacheKey(slug),
      JSON.stringify({ wiki, generatedAt: Date.now() } satisfies Cached)
    )
  } catch {
    // quota / disabled — silently ignore
  }
}

const clearCache = (slug: string) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(cacheKey(slug))
  } catch {
    // ignore
  }
}

const fmtAge = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s 前`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min 前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h 前`
  const d = Math.floor(h / 24)
  return `${d}d 前`
}

export const CategoryWiki: React.FC<Props> = ({ slug, itemCount }) => {
  const [loading, setLoading] = useState(false)
  const [wiki, setWiki] = useState('')
  const [error, setError] = useState('')
  const [cachedAt, setCachedAt] = useState<number | null>(null)
  const [showRefine, setShowRefine] = useState(false)
  const [extra, setExtra] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const c = readCache(slug)
    if (c) {
      setWiki(c.wiki)
      setCachedAt(c.generatedAt)
    }
  }, [slug])

  const run = async (extraPrompt = '') => {
    clearCache(slug)
    setLoading(true)
    setError('')
    setWiki('')
    setCachedAt(null)
    setShowRefine(false)
    try {
      const body: Record<string, string> = { slug }
      if (extraPrompt.trim()) body.extra = extraPrompt.trim()
      const r = await fetch('/api/category-wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || '请求失败')
      } else {
        const w = data.wiki || ''
        setWiki(w)
        writeCache(slug, w)
        setCachedAt(Date.now())
        setExtra('')
      }
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mm-cat-wiki">
      {!wiki && !loading && !error && (
        <button
          type="button"
          className="mm-cat-wiki-trigger"
          onClick={() => run()}
          disabled={loading}
        >
          <Sparkles size={14} className="mm-pulse-icon" />
          <span>AI 深度分析本分类</span>
          <span className="mm-cat-wiki-badge">{itemCount}</span>
          <span className="mm-cat-wiki-hint">是什么 · 如何用 · 同类对比 · 领域 · 活跃度</span>
        </button>
      )}

      {loading && (
        <div className="mm-cat-wiki-loading">
          <Loader2 size={14} className="mm-spin" />
          <span>正在调 DeepSeek 分析 {itemCount} 个项目，约 10-25 秒…</span>
        </div>
      )}

      {error && (
        <div className="mm-cat-wiki-error">
          ⚠ {error}
          <button type="button" onClick={() => run('')} className="mm-cat-wiki-retry">
            <RefreshCcw size={11} /> 重试
          </button>
        </div>
      )}

      {wiki && (
        <div className={`mm-cat-wiki-result ${collapsed ? 'is-collapsed' : ''}`}>
          <div className="mm-cat-wiki-result-head">
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="mm-cat-wiki-collapse"
              aria-expanded={!collapsed}
              aria-label={collapsed ? '展开分析' : '折叠分析'}
              title={collapsed ? '展开分析' : '折叠分析'}
            >
              <ChevronDown
                size={13}
                style={{
                  transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.18s ease'
                }}
              />
            </button>
            <Sparkles size={13} />
            <span>AI 项目级深度分析（DeepSeek）</span>
            {cachedAt && (
              <span className="mm-cat-wiki-cached" title={new Date(cachedAt).toLocaleString()}>
                · 缓存于 {fmtAge(cachedAt)}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setCollapsed(false)
                setShowRefine((v) => !v)
              }}
              className="mm-cat-wiki-refresh"
            >
              <RefreshCcw size={11} /> 重新分析
            </button>
          </div>
          {showRefine && (
            <form
              className="mm-cat-wiki-refine"
              onSubmit={(e) => {
                e.preventDefault()
                run(extra)
              }}
            >
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="可选：给本次分析加增强提示词（例如「重点对比 stars > 10k 的项目」「面向初学者讲」「侧重商业落地」）。留空 = 直接重新生成。"
                rows={2}
                className="mm-cat-wiki-refine-input"
                autoFocus
              />
              <div className="mm-cat-wiki-refine-actions">
                <button type="submit" className="mm-cat-wiki-refine-submit" disabled={loading}>
                  <Sparkles size={11} /> {extra.trim() ? '按提示词重新生成' : '重新生成'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRefine(false)
                    setExtra('')
                  }}
                  className="mm-cat-wiki-refine-cancel"
                  aria-label="取消"
                >
                  <X size={12} />
                </button>
              </div>
            </form>
          )}
          <div
            className="mm-cat-wiki-md"
            dangerouslySetInnerHTML={{ __html: marked.parse(wiki) as string }}
          />
        </div>
      )}
    </section>
  )
}

export default CategoryWiki
