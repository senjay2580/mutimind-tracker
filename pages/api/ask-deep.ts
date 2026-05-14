import type { NextApiRequest, NextApiResponse } from 'next'
import repos from '../../lib/repos.json'
import { applyCors } from '../../lib/cors'

type Repo = {
  name: string
  owner: string
  url: string
  stars: number | null
  lang: string | null
  license: string | null
  category: string
  slug: string
  description: string
}

// ----- Stage 1: semantic candidate selection (JSON-only, small response) -----

const STAGE1_SYSTEM = `你是 MutiMind 站的语义候选筛选器。任务：从【项目库】中挑出与用户提问最相关的 5 个项目 URL。

【铁律】
1. 只能返回项目库中真实存在的 URL，1:1 复制。
2. 严格按相关性排序，最相关在前。
3. 返回纯 JSON：{"urls":["url1","url2","url3","url4","url5"]}，不要多余文字。
4. 即使库里匹配不足 5 个，也尽量凑到 5 个（用接近的兜底）。`.trim()

const STAGE2_SYSTEM = `你是 MutiMind 站的深度选型分析师。下面给你的是 5 个候选 GitHub 项目的真实 README 片段。基于这些**真实内容**给用户做深度对比和选型建议。

【铁律】
1. 答案必须基于给定的 README 内容，不要从训练知识里推断。
2. URL 必须 1:1 引用给定候选，不要编造。
3. 中文回答，专业、有信息密度、不寒暄。
4. 输出结构（严格遵守）：

理解：<一句话复述用户意图>。

## 推荐排序

1. **[项目名](URL)** · ★N · lang
   - **核心能力**：基于 README 的 2-3 个具体特性（不是营销词）
   - **匹配点**：为什么命中用户需求（引一两个 README 里的具体证据）
   - **取舍**：依赖 / 学习曲线 / 已知限制（如果 README 提到）

2. ...

## 选型建议

| 场景 | 选谁 | 理由 |
| --- | --- | --- |
| <场景1> | 项目名 | 一句话 |
| <场景2> | 项目名 | 一句话 |

**一句话总结**：<给一个明确倾向，不要"看情况"式废话>。`.trim()

function buildLibraryLine(r: Repo): string {
  const desc = r.description.replace(/\s+/g, ' ').slice(0, 200).trim()
  const stars = r.stars ? `★${r.stars}` : '★?'
  return `- ${r.name} | ${r.url} | ${r.category} | ${stars} | ${r.lang || '-'} | ${desc}`
}

async function stage1Pick(query: string, apiKey: string): Promise<string[]> {
  const allRepos = repos as Repo[]
  const library = allRepos.map(buildLibraryLine).join('\n')
  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: STAGE1_SYSTEM },
        {
          role: 'user',
          content: `【项目库】\n${library}\n\n【用户提问】\n${query}\n\n返回 JSON: {"urls":[...5 个 URL...]}`
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    })
  })
  if (!upstream.ok) throw new Error(`stage1 ${upstream.status}`)
  const data = await upstream.json()
  const content: string = data.choices?.[0]?.message?.content || '{}'
  let parsed: { urls?: string[] }
  try {
    parsed = JSON.parse(content)
  } catch {
    parsed = {}
  }
  const validUrls = new Set(allRepos.map((r) => r.url))
  const urls = (parsed.urls || []).filter((u: string) => validUrls.has(u)).slice(0, 5)
  return urls
}

// ----- README fetch (no auth, no rate limit) -----

function parseOwnerRepo(url: string): { owner: string; repo: string } | null {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/?#]+)/)
  if (!m) return null
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') }
}

async function fetchReadme(url: string, timeoutMs = 5000): Promise<string | null> {
  const parsed = parseOwnerRepo(url)
  if (!parsed) return null
  const { owner, repo } = parsed
  const candidates = [
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.zh.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README_CN.md`
  ]
  for (const u of candidates) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(timeoutMs) })
      if (r.ok) {
        const text = await r.text()
        if (text && text.length > 100) return text
      }
    } catch {
      // continue
    }
  }
  return null
}

function compactReadme(md: string, maxChars = 3000): string {
  // Strip code fences (mostly noise for selection analysis), HTML comments, badges, and excessive whitespace
  let s = md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // images
    .replace(/\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/g, '') // badge links
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (s.length > maxChars) s = s.slice(0, maxChars) + '\n…(截断)'
  return s
}

// ----- Stage 2: streaming deep analysis -----

async function streamStage2(
  res: NextApiResponse,
  query: string,
  evidence: Array<{ repo: Repo; readme: string | null }>,
  apiKey: string
) {
  const evidenceText = evidence
    .map((e, i) => {
      const r = e.repo
      const meta = `${r.name} | ${r.url} | ★${r.stars ?? '?'} | ${r.lang || '-'} | 分类: ${r.category}`
      const body = e.readme
        ? compactReadme(e.readme)
        : `(README 抓取失败，回落到站内描述) ${r.description}`
      return `### 候选 ${i + 1}: ${meta}\n${body}`
    })
    .join('\n\n---\n\n')

  const upstream = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      stream: true,
      messages: [
        { role: 'system', content: STAGE2_SYSTEM },
        {
          role: 'user',
          content: `【用户提问】\n${query}\n\n【5 个候选项目的真实 README 片段】\n${evidenceText}\n\n请按系统提示的输出结构给出深度选型分析。`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    })
  })

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'stage2 upstream', detail: detail.slice(0, 300) })}\n\n`)
    res.end()
    return
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const raw of lines) {
      const line = raw.trim()
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') continue
      try {
        const j = JSON.parse(payload)
        const delta: string = j.choices?.[0]?.delta?.content || ''
        if (delta) {
          res.write(`event: token\ndata: ${JSON.stringify({ t: delta })}\n\n`)
        }
      } catch {
        // ignore malformed chunk
      }
    }
  }
  res.write(`event: done\ndata: {}\n\n`)
  res.end()
}

// ----- Handler -----

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY not set' })
  }

  const { query } = (req.body || {}) as { query?: string }
  if (!query || typeof query !== 'string' || query.length < 2) {
    return res.status(400).json({ error: 'query required (≥ 2 chars)' })
  }
  if (query.length > 500) {
    return res.status(400).json({ error: 'query too long' })
  }

  // SSE prelude
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  ;(res as any).flushHeaders?.()

  const allRepos = repos as Repo[]
  const urlMap = new Map(allRepos.map((r) => [r.url, r]))

  try {
    // Stage 1: pick candidates
    res.write(`event: status\ndata: ${JSON.stringify({ stage: 1, msg: '语义筛选候选项目…' })}\n\n`)
    const picked = await stage1Pick(query, apiKey)
    if (picked.length === 0) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: '语义筛选无结果' })}\n\n`)
      res.end()
      return
    }
    const candidates = picked.map((url) => urlMap.get(url)!).filter(Boolean)
    res.write(
      `event: candidates\ndata: ${JSON.stringify({
        items: candidates.map((r) => ({ name: r.name, url: r.url, category: r.category }))
      })}\n\n`
    )

    // Fetch READMEs in parallel
    res.write(`event: status\ndata: ${JSON.stringify({ stage: 2, msg: '抓取 README 证据…' })}\n\n`)
    const fetched = await Promise.allSettled(candidates.map((r) => fetchReadme(r.url)))
    const evidence = candidates.map((r, i) => ({
      repo: r,
      readme: fetched[i].status === 'fulfilled' ? (fetched[i] as PromiseFulfilledResult<string | null>).value : null
    }))
    const okCount = evidence.filter((e) => e.readme).length
    res.write(`event: status\ndata: ${JSON.stringify({ stage: 3, msg: `生成深度分析 (${okCount}/5 README 命中)…` })}\n\n`)

    // Stage 2: streaming
    await streamStage2(res, query, evidence, apiKey)
  } catch (e: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: String(e).slice(0, 300) })}\n\n`)
    res.end()
  }
}
