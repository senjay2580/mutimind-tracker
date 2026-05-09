import type { NextApiRequest, NextApiResponse } from 'next'
import repos from '../../lib/repos.json'

type Repo = {
  name: string
  owner: string
  url: string
  stars: number | null
  updated: string | null
  lang: string | null
  license: string | null
  category: string
  slug: string
  description: string
}

const SYSTEM = `你是 MutiMind 优质开源项目追踪站的 AI 推荐助手。下面【项目库】里是站里收录的全部 GitHub 开源项目，你的任务是根据用户提问从中精准选出最相关的几个。

【铁律】
1. 你只能推荐【项目库】里出现过的项目。绝对不允许从训练知识里"想"出项目或自己编造 URL。每个被引用的 URL 必须 1:1 复制自项目库。
2. 用中文回答，先用一句话复述/澄清用户意图，再给推荐。
3. 推荐数量：相关性高就给 3-6 个；用户问题非常宽泛（如"找点 AI 工具"）则各分类各挑 1 个，给 4-6 个跨分类的代表。
4. 引用项目格式严格为 markdown 链接：\`[项目名](URL)\`，名字与 URL 必须配对。
5. 库里完全没匹配 → 直接说"库里暂无完全匹配的"，再给最接近的 1-2 个 + 建议关键词。不要为了凑数硬塞。
6. 字段含义：每条记录是 "项目名 | URL | 分类 | stars | lang | 描述"。stars/lang 缺失就是 null。

【输出风格】
- 简洁、专业、有结构。不寒暄、不重复用户问题原文。
- 排序：最匹配的放最前面。
- 每条推荐一句话点评：核心能力 + 为什么和提问匹配 + (可选) 与同类的关键差异。
- 如果用户问的是 "A vs B / 哪个更好"，要明确给倾向 + 一句话理由。
- 末尾可选 1 句简短选型建议（仅在有 2+ 候选且权衡明显时给）。

【输出模板】
理解：<一句话>。

1. **[项目名](URL)** · ★N · lang — 一句话点评。
2. **[项目名](URL)** · ★N · lang — 一句话点评。
...

（可选）建议：<一句话选型提示>。`.trim()

function buildLibrary(allRepos: Repo[]): string {
  // Compact each repo to one line. Truncate description hard.
  return allRepos
    .map((r) => {
      const desc = r.description.replace(/\s+/g, ' ').slice(0, 220).trim()
      const stars = r.stars ? `★${r.stars}` : '★?'
      const lang = r.lang || '-'
      return `- ${r.name} | ${r.url} | ${r.category} | ${stars} | ${lang} | ${desc}`
    })
    .join('\n')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    return res.status(400).json({ error: 'query too long (≤ 500 chars)' })
  }

  // Send the FULL library — let DeepSeek do semantic matching, way better than my regex.
  const allRepos = repos as Repo[]
  const library = buildLibrary(allRepos)

  // Pre-filter sources for the response: light keyword overlap to attach citations
  // (the model is the source of truth for the answer; this is just for UI source chips)
  const q = query.toLowerCase()
  const presortedSources = allRepos
    .map((r) => {
      const hay = (r.name + ' ' + r.description + ' ' + r.category).toLowerCase()
      let score = 0
      // 2-char and 3-char Chinese n-grams + ASCII tokens
      const grams = new Set<string>()
      for (let i = 0; i < q.length - 1; i++) {
        const g2 = q.slice(i, i + 2).trim()
        if (g2.length === 2) grams.add(g2)
        const g3 = q.slice(i, i + 3).trim()
        if (g3.length === 3) grams.add(g3)
      }
      for (const t of q.split(/[\s,，。、；;:：!！?？()（）]+/)) {
        if (t.length >= 2) grams.add(t)
      }
      for (const g of grams) {
        if (hay.includes(g)) {
          score += 1
          if (r.name.toLowerCase().includes(g)) score += 4
          if (r.category.toLowerCase().includes(g)) score += 2
        }
      }
      return { r, score }
    })
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, 8)
    .map((x) => x.r)

  const messages = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `【项目库】\n${library}\n\n【用户提问】\n${query}\n\n请按【输出模板】给出推荐。`
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
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 2000
      })
    })
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      return res.status(502).json({ error: 'DeepSeek upstream error', detail: detail.slice(0, 500) })
    }
    const data = await upstream.json()
    const answer: string = data.choices?.[0]?.message?.content || ''

    // Extract URLs the model actually cited, in order — those are the "real" sources
    const citedUrls = Array.from(
      new Set(
        Array.from(answer.matchAll(/https:\/\/github\.com\/[a-zA-Z0-9._/-]+/g)).map((m) =>
          m[0].replace(/[).,;]+$/, '')
        )
      )
    )
    const citedSources = citedUrls
      .map((url) => allRepos.find((r) => r.url === url))
      .filter((x): x is Repo => Boolean(x))
      .map((r) => ({ name: r.name, url: r.url, category: r.category }))

    // Fallback to keyword-presorted if model didn't cite (shouldn't happen with strong prompt)
    const sources = citedSources.length
      ? citedSources
      : presortedSources.map((r) => ({ name: r.name, url: r.url, category: r.category }))

    return res.status(200).json({ answer, sources })
  } catch (e: any) {
    return res.status(500).json({ error: 'Network error', detail: String(e).slice(0, 300) })
  }
}
