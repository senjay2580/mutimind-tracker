import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send, Loader2, ExternalLink, Zap } from 'lucide-react'
import { marked } from 'marked'

type Source = { name: string; url: string; category: string }

const DEEP_KEY = 'mm-ask-deep'

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
  const [deep, setDeep] = useState(false)
  const [stageMsg, setStageMsg] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const v = localStorage.getItem(DEEP_KEY)
      if (v === '1') setDeep(true)
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem(DEEP_KEY, deep ? '1' : '0')
    } catch {}
  }, [deep])

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
    setStageMsg('')
    try {
      if (deep) {
        await submitDeep(text)
      } else {
        await submitFast(text)
      }
    } catch (e: any) {
      setError(String(e))
    } finally {
      setLoading(false)
      setStageMsg('')
    }
  }

  const submitFast = async (text: string) => {
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
  }

  const submitDeep = async (text: string) => {
    const r = await fetch('/api/ask-deep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    })
    if (!r.ok || !r.body) {
      const errBody = await r.json().catch(() => ({}))
      setError(errBody.error || `深度检索失败 (${r.status})`)
      return
    }
    const reader = r.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let accum = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const blocks = buf.split('\n\n')
      buf = blocks.pop() || ''
      for (const block of blocks) {
        const lines = block.split('\n')
        let event = 'message'
        let dataStr = ''
        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim()
          else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
        }
        if (!dataStr) continue
        let payload: any = {}
        try {
          payload = JSON.parse(dataStr)
        } catch {
          continue
        }
        if (event === 'status') {
          setStageMsg(payload.msg || '')
        } else if (event === 'candidates') {
          setSources(payload.items || [])
        } else if (event === 'token') {
          accum += payload.t || ''
          setAnswer(accum)
        } else if (event === 'error') {
          setError(payload.error || '深度检索错误')
        } else if (event === 'done') {
          // finalize
        }
      }
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

            <div className="mm-modal-mode-row">
              <button
                type="button"
                className={`mm-modal-mode-toggle ${deep ? 'is-on' : ''}`}
                onClick={() => setDeep((v) => !v)}
                aria-pressed={deep}
                title="深度模式：先 AI 语义筛 5 个候选，再实时抓 README 做对比分析（约 12-15s）"
              >
                <Zap size={12} strokeWidth={2.4} />
                深度分析
                <span className="mm-modal-mode-state">{deep ? 'ON' : 'OFF'}</span>
              </button>
              <span className="mm-modal-mode-hint">
                {deep ? '语义筛选 → 抓 README → 对比 · ~12-15s' : '关键词匹配 · ~3s'}
              </span>
            </div>

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

            {loading && !answer && (
              <div className="mm-modal-loading">
                <span className="mm-loading-dot" />
                <span className="mm-loading-dot" />
                <span className="mm-loading-dot" />
                <span style={{ opacity: 0.6, marginLeft: 8 }}>
                  {stageMsg || '检索中…'}
                </span>
              </div>
            )}
            {loading && answer && stageMsg && (
              <div className="mm-modal-stage-banner">
                <Loader2 size={12} className="mm-spin" />
                {stageMsg}
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
