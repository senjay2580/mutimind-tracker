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

const SYSTEM = `你是 MutiMind 优质开源项目追踪站的「分类深度分析」助手。

你将收到一个分类下所有项目的清单（项目名 + URL + stars + lang + 描述）。请基于这些信息生成一份**结构化的分类深度分析 wiki**。

【铁律】
1. 所有信息都基于给定项目清单。可以适度依据项目名、URL、描述做合理引申，但不许编造不存在的项目。
2. 结构必须严格按下方 5 段输出：① 是什么项目 ② 如何使用 ③ 同类项目对比 ④ 应用领域 / 功能 ⑤ 最近活跃度。
3. 中文回答，行文专业、紧凑、可执行。每段 80-200 字。
4. 引用项目用 markdown 链接：\`[名称](URL)\`。

【输出模板】
## 🧭 是什么项目
（用 1-3 句话讲清这个分类下的项目共同解决什么问题、属于什么技术大类、面向什么用户群）

## 🛠️ 如何使用
（典型上手路径：怎么 install / 怎么集成 / 跑通最小 demo 通常需要哪些步骤；如果项目类型多样就分组讲）

## 🔁 同类项目对比 / 选型
（基于清单按 stars / 维护活跃度 / 定位差异给出 2-4 条选型建议。明确指出"X 适合 A，Y 更适合 B"）

## 🎯 应用领域 / 功能
（按使用场景维度拆，每个场景给 1-2 个推荐项目；可以引用 GitHub URL）

## ⏱️ 最近活跃度
（基于 stars 数量、看上去更新频率，对整个分类的活跃度给一个综合判断；指出最活跃 / 最被低估的几个）`.trim()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY not set' })
  }

  const { slug } = (req.body || {}) as { slug?: string }
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'slug required' })
  }

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

  const messages = [
    { role: 'system', content: SYSTEM },
    {
      role: 'user',
      content: `【分类】${category} (slug: ${slug})\n\n【该分类下全部项目】\n${library}\n\n请按【输出模板】给出 wiki 风格的深度分析。`
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
        top_p: 0.9,
        max_tokens: 2500
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
      itemCount: items.length
    })
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: 'Network error', detail: String(e).slice(0, 300) })
  }
}
