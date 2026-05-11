import React, { useState } from 'react'
import { Sparkles, Loader2, RefreshCcw } from 'lucide-react'
import { marked } from 'marked'

type Props = { slug: string; itemCount: number }

export const CategoryWiki: React.FC<Props> = ({ slug, itemCount }) => {
  const [loading, setLoading] = useState(false)
  const [wiki, setWiki] = useState('')
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true)
    setError('')
    setWiki('')
    try {
      const r = await fetch('/api/category-wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || '请求失败')
      } else {
        setWiki(data.wiki || '')
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
          onClick={run}
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
          <button type="button" onClick={run} className="mm-cat-wiki-retry">
            <RefreshCcw size={11} /> 重试
          </button>
        </div>
      )}

      {wiki && (
        <div className="mm-cat-wiki-result">
          <div className="mm-cat-wiki-result-head">
            <Sparkles size={13} />
            <span>AI 深度分析（DeepSeek）</span>
            <button type="button" onClick={run} className="mm-cat-wiki-refresh">
              <RefreshCcw size={11} /> 重新生成
            </button>
          </div>
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
