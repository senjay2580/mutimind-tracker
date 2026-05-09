import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, Loader2, ExternalLink } from 'lucide-react'
import { marked } from 'marked'

type Source = { name: string; url: string; category: string }

const SUGGESTIONS = [
  '推荐 2 个轻量好用的 RAG 框架',
  '帮我找一个能跑在手机上的 LLM',
  '有没有 Claude Code 的 skill 大全',
  '想学具身智能 / VLA，哪个仓库最合适入门',
  '有没有把网页 / 应用包成 CLI 给 AI agent 用的工具'
]

export const AskFab: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Cmd/Ctrl + K to open, ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  const submit = async (q?: string) => {
    const text = (q ?? query).trim()
    if (!text || loading) return
    setQuery(text)
    setLoading(true)
    setError('')
    setAnswer('')
    setSources([])
    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || '请求失败')
      } else {
        setAnswer(data.answer || '')
        setSources(data.sources || [])
      }
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setQuery('')
    setAnswer('')
    setSources([])
    setError('')
  }

  return (
    <>
      {/* Floating action button — breathing glow */}
      <button
        type="button"
        aria-label="AI 检索（Ctrl+K）"
        title="AI 检索（Ctrl/⌘ + K）"
        onClick={() => setOpen(true)}
        className="mm-fab"
      >
        <span className="mm-fab-pulse" aria-hidden />
        <Sparkles size={22} strokeWidth={2.2} />
      </button>

      {open && (
        <div
          className="mm-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="mm-modal" role="dialog" aria-modal="true">
            <header className="mm-modal-header">
              <div className="mm-modal-title">
                <Sparkles size={16} className="mm-pulse-icon" />
                <span>AI 检索</span>
                <span className="mm-modal-hint">DeepSeek + 142 个库内项目</span>
              </div>
              <button
                type="button"
                className="mm-modal-close"
                onClick={() => setOpen(false)}
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </header>

            <form
              className="mm-modal-input-row"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="问点什么…例如：有没有自主进化的 agent 框架"
                rows={1}
                className="mm-modal-input"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="mm-modal-send"
                aria-label="发送"
              >
                {loading ? <Loader2 size={16} className="mm-spin" /> : <Send size={16} />}
              </button>
            </form>

            {!answer && !loading && !error && (
              <div className="mm-modal-suggestions">
                <div className="mm-modal-suggestions-label">试试这些</div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="mm-modal-suggestion"
                    onClick={() => submit(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="mm-modal-loading">
                <span className="mm-loading-dot" />
                <span className="mm-loading-dot" />
                <span className="mm-loading-dot" />
                <span style={{ opacity: 0.6, marginLeft: 8 }}>检索中…</span>
              </div>
            )}

            {error && <div className="mm-modal-error">⚠ {error}</div>}

            {answer && (
              <div className="mm-modal-answer">
                <div
                  className="mm-modal-answer-md"
                  dangerouslySetInnerHTML={{ __html: marked.parse(answer) as string }}
                />
                {sources.length > 0 && (
                  <div className="mm-modal-sources">
                    <div className="mm-modal-sources-label">相关来源</div>
                    <div className="mm-modal-sources-list">
                      {sources.map((s) => (
                        <a
                          key={s.url}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mm-source-chip"
                        >
                          <ExternalLink size={11} />
                          {s.name}
                          <span className="mm-source-cat">{s.category}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mm-modal-actions">
                  <button type="button" onClick={reset} className="mm-modal-reset">
                    再问一个
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default AskFab
