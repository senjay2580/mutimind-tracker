import React, { useState } from 'react'

type Endpoint = {
  method: 'GET' | 'POST'
  path: string
  summary: string
  example: string
  exampleCurl?: string
}

const BASE = 'https://mutimind-tracker.vercel.app'

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api',
    summary: '自描述端点列表（拿不准用什么先调这个）',
    example: `${BASE}/api`,
    exampleCurl: `curl ${BASE}/api`
  },
  {
    method: 'GET',
    path: '/api/categories',
    summary: '所有分类 + 项目数 + 总 star + 24h 新增数',
    example: `${BASE}/api/categories`,
    exampleCurl: `curl ${BASE}/api/categories`
  },
  {
    method: 'GET',
    path: '/api/repos',
    summary: '列 / 筛选项目（slug · lang · q · minStars · newOnly · limit · offset · fields）',
    example: `${BASE}/api/repos?slug=cli-agent&minStars=1000&limit=20`,
    exampleCurl: `curl '${BASE}/api/repos?slug=cli-agent&minStars=1000'`
  },
  {
    method: 'GET',
    path: '/api/search',
    summary: '关键词快速检索（词频打分，无 LLM）',
    example: `${BASE}/api/search?q=mcp&limit=10`,
    exampleCurl: `curl '${BASE}/api/search?q=mcp'`
  },
  {
    method: 'GET',
    path: '/api/recent',
    summary: '最近 N 小时新增的项目',
    example: `${BASE}/api/recent?hours=72&limit=30`,
    exampleCurl: `curl '${BASE}/api/recent?hours=72'`
  },
  {
    method: 'POST',
    path: '/api/ask',
    summary: 'AI 推荐 · DeepSeek + 全库自然语言问答',
    example: `body: { "query": "推荐 2 个轻量 RAG 框架" }`,
    exampleCurl: `curl -X POST ${BASE}/api/ask \\\n  -H 'Content-Type: application/json' \\\n  -d '{"query":"找一个能跑在手机上的 LLM"}'`
  },
  {
    method: 'POST',
    path: '/api/category-wiki',
    summary: 'AI 深度分析单个分类（5 段 wiki，DeepSeek）',
    example: `body: { "slug": "cli-agent" }`,
    exampleCurl: `curl -X POST ${BASE}/api/category-wiki \\\n  -H 'Content-Type: application/json' \\\n  -d '{"slug":"cli-agent"}'`
  }
]

const methodColor = (m: string) =>
  m === 'GET' ? '#60a5fa' : '#a78bfa'

export const ApiList: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1400)
    })
  }

  return (
    <section className="mm-api-list">
      <div className="mm-api-head">
        <div className="mm-api-head-left">
          <div className="mm-api-eyebrow">PUBLIC API · 公开只读 · CORS 全开 · 无需 auth</div>
          <h2 className="mm-api-title">站点 API</h2>
          <p className="mm-api-desc">
            让 AI / 脚本 / 任意 client 直接检索、筛选、分析本站收录的 230+ 个开源项目。
            完整自描述见 <a href="https://mutimind-tracker.vercel.app/api" target="_blank" rel="noreferrer">/api</a>。
          </p>
        </div>
        <div className="mm-api-base-pill" title="Base URL">
          <span className="mm-api-base-label">BASE</span>
          <code>{BASE}</code>
        </div>
      </div>

      <div className="mm-api-table">
        {ENDPOINTS.map((e) => {
          const key = `${e.method}-${e.path}`
          return (
            <div className="mm-api-row" key={key}>
              <span
                className="mm-api-method"
                style={{ '--m-color': methodColor(e.method) } as React.CSSProperties}
              >
                {e.method}
              </span>
              <code className="mm-api-path">{e.path}</code>
              <span className="mm-api-summary">{e.summary}</span>
              <button
                className="mm-api-copy"
                onClick={() => copy(e.exampleCurl ?? e.example, key)}
                title="复制示例"
              >
                {copied === key ? '✓ 已复制' : 'copy'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mm-api-foot">
        <span>📦 边缘缓存 2-5 分钟</span>
        <span>·</span>
        <span>⚡ DeepSeek 端点 1-3s 响应</span>
        <span>·</span>
        <span>🌐 CORS Allow-Origin <code>*</code></span>
        <span>·</span>
        <a href="https://github.com/senjay2580/mutimind-tracker/blob/main/API.md" target="_blank" rel="noreferrer">完整文档 →</a>
      </div>
    </section>
  )
}

export default ApiList
