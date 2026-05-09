import type { NextApiRequest, NextApiResponse } from 'next'
import repos from '../../lib/repos.json'

type Repo = { name: string; url: string; category: string; slug: string; description: string }

const SYSTEM = `你是 MutiMind 优质开源项目追踪站的 AI 检索助手。
- 用户库里只有下面给你的项目；不要编造、不要从训练数据里"想"出 URL。
- 回答用中文，简洁有结构；引用项目时用 markdown 链接 [项目名](url)，URL 必须来自下方列表。
- 列表没有合适的项目就明说"库里暂无完全匹配的，可以试试关键词 X / Y"。
- 推荐时给 2-5 个最相关的，每个一句话说明为什么相关。`.trim()

// Naive but effective keyword scoring — token overlap weighted by category match
function rank(query: string, allRepos: Repo[]): Repo[] {
  const q = query.toLowerCase()
  const tokens = q
    .split(/[\s,，。、；;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && t.length < 30)
  if (!tokens.length) return allRepos.slice(0, 30)

  const scored = allRepos.map((r) => {
    const hay = (r.name + ' ' + r.description + ' ' + r.category + ' ' + r.url).toLowerCase()
    let score = 0
    for (const t of tokens) {
      if (!hay.includes(t)) continue
      score += 1
      if (r.name.toLowerCase().includes(t)) score += 4
      if (r.category.toLowerCase().includes(t)) score += 2
    }
    return { r, score }
  })

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((x) => x.r)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY not set on server' })
  }

  const { query } = (req.body || {}) as { query?: string }
  if (!query || typeof query !== 'string' || query.length < 2) {
    return res.status(400).json({ error: 'query required (≥ 2 chars)' })
  }
  if (query.length > 500) {
    return res.status(400).json({ error: 'query too long (≤ 500 chars)' })
  }

  const candidates = rank(query, repos as Repo[])
  // Always send at least a sample so model can answer broad questions
  const context = (candidates.length ? candidates : (repos as Repo[]).slice(0, 25))
    .slice(0, 30)
    .map((r) => `- ${r.name} | ${r.url} | 分类:${r.category} | ${r.description}`)
    .join('\n')

  const messages = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `用户问: ${query}\n\n候选项目库（top ${Math.min(candidates.length || 25, 30)}）:\n${context}\n\n基于上面的项目库给出推荐。`
    }
  ]

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        stream: false,
        temperature: 0.4,
        max_tokens: 1200
      })
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      return res.status(502).json({ error: 'DeepSeek upstream error', detail: detail.slice(0, 500) })
    }
    const data = await upstream.json()
    const answer: string = data.choices?.[0]?.message?.content || ''
    return res.status(200).json({
      answer,
      sources: candidates.slice(0, 8).map((r) => ({ name: r.name, url: r.url, category: r.category }))
    })
  } catch (e: any) {
    return res.status(500).json({ error: 'Network error', detail: String(e).slice(0, 300) })
  }
}
