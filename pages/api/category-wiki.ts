import type { NextApiRequest, NextApiResponse } from 'next'
import repos from '../../lib/repos.json'
import { applyCors } from '../../lib/cors'

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

const SYSTEM = `你是 MutiMind 优质开源项目追踪站的「项目级深度分析」助手。

你将收到一个分类下所有项目的清单（项目名 + URL + stars + lang + 描述）。请**逐个项目**输出深度分析卡片，**不要做整体糅合的总览**。

【铁律】
1. 所有信息都基于给定项目清单。可以适度依据项目名、URL、描述做合理引申，但不许编造不存在的项目。
2. **逐项输出**：每个项目一个 \`## [项目名](URL)\` 二级标题块，**不要把多个项目糅成一段**。
3. 每个项目按下方 5 个 bullet 维度展开（每条 1-2 句话，不堆砌）：
   - **是什么** — 一句话定位 + 核心能力
   - **怎么用** — 上手路径 (install / 命令 / 集成方式)
   - **同类对比** — 同清单内 vs 哪些项目，差异在哪
   - **应用场景** — 适合谁 / 什么任务最值得用
   - **活跃度** — 基于 stars + 看起来的迭代速度做一句话判断
4. 中文回答；行文紧凑、专业、可执行；不寒暄、不重复用户问题。
5. 引用同分类内的其他项目用 markdown 链接：\`[名称](URL)\`，URL 必须 1:1 复制清单里的 URL。
6. 项目顺序：默认按 stars 降序；如果用户额外提示词指定了别的排序逻辑就遵从。

【输出模板】
> 一句话总览（≤ 30 字，告诉读者这个分类整体是干什么的，作为开篇导航句）

## [项目1名](URL1)
- **是什么** — ...
- **怎么用** — ...
- **同类对比** — vs [项目X](urlX)：...
- **应用场景** — ...
- **活跃度** — ...

## [项目2名](URL2)
- **是什么** — ...
... (依此类推, 每个项目都给完整 5 维度)

如果项目超过 15 个，对 stars 排名最末的小项目可以适度精简（每条 1 句话即可），但**仍然要逐项出现**，不允许合并或省略。`.trim()

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

  const { slug, extra } = (req.body || {}) as { slug?: string; extra?: string }
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'slug required' })
  }
  const extraPrompt =
    typeof extra === 'string' && extra.trim().length
      ? extra.trim().slice(0, 800)
      : ''

  const items = (repos as Repo[]).filter((r) => r.slug === slug)
  if (!items.length) {
    return res.status(404).json({ error: `no repos for slug=${slug}` })
  }

  const category = items[0].category
  const library = items
    .map((r) => {
      const desc = r.description.replace(/\s+/g, ' ').slice(0, 240).trim()
      const stars = r.stars ? `★${r.stars}` : '★?'
      const lang = r.lang || '-'
      return `- ${r.name} | ${r.url} | ${stars} | ${lang} | ${desc}`
    })
    .join('\n')

  const userContent = [
    `【分类】${category} (slug: ${slug})`,
    '',
    '【该分类下全部项目】',
    library,
    '',
    extraPrompt
      ? `【用户本次的额外要求 / 增强提示词】\n${extraPrompt}\n\n请在保持 5 段结构的前提下，让分析特别贴合上面的要求。`
      : '请按【输出模板】给出 wiki 风格的深度分析。'
  ].join('\n')

  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: userContent }
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
        temperature: 0.35,
        top_p: 0.9,
        max_tokens: 6000
      })
    })
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      return res
        .status(502)
        .json({ error: 'DeepSeek upstream error', detail: detail.slice(0, 500) })
    }
    const data = await upstream.json()
    const wiki: string = data.choices?.[0]?.message?.content || ''

    return res.status(200).json({
      wiki,
      category,
      slug,
      itemCount: items.length,
      extra: extraPrompt || undefined
    })
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: 'Network error', detail: String(e).slice(0, 300) })
  }
}
