import type { NextApiRequest, NextApiResponse } from 'next'
import repos from '../../lib/repos.json'
import { applyCors } from '../../lib/cors'

type Repo = {
  name: string
  owner: string
  url: string
  stars: number | null
  category: string
  slug: string
  description: string
  lang: string | null
}

/**
 * GET /api/search?q=<keyword>&limit=20
 *
 * Fast keyword search (no LLM). Scores by token overlap with name/description/category.
 * Returns ranked items with score. For semantic / nuanced retrieval use /api/ask instead.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { q = '', limit = '20' } = req.query as Record<string, string>
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'q required (>= 2 chars)' })
  }

  const lim = Math.min(100, Math.max(1, Number(limit) || 20))
  const needle = q.toLowerCase()

  const grams = new Set<string>()
  for (let i = 0; i < needle.length - 1; i++) {
    const g2 = needle.slice(i, i + 2).trim()
    if (g2.length === 2) grams.add(g2)
    const g3 = needle.slice(i, i + 3).trim()
    if (g3.length === 3) grams.add(g3)
  }
  for (const t of needle.split(/[\s,，。、；;:：!！?？()（）]+/)) {
    if (t.length >= 2) grams.add(t)
  }

  const scored = (repos as Repo[])
    .map((r) => {
      const hay = (r.name + ' ' + r.description + ' ' + r.category).toLowerCase()
      let score = 0
      for (const g of grams) {
        if (hay.includes(g)) {
          score += 1
          if (r.name.toLowerCase().includes(g)) score += 4
          if (r.category.toLowerCase().includes(g)) score += 2
        }
      }
      return { r, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || ((b.r.stars ?? 0) - (a.r.stars ?? 0)))
    .slice(0, lim)
    .map((x) => ({ score: x.score, ...x.r }))

  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
  return res.status(200).json({
    query: q,
    count: scored.length,
    items: scored
  })
}
