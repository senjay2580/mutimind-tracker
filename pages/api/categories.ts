import type { NextApiRequest, NextApiResponse } from 'next'
import repos from '../../lib/repos.json'
import { applyCors } from '../../lib/cors'

type Repo = {
  slug: string
  category: string
  stars: number | null
  addedAt?: string
}

/**
 * GET /api/categories
 *
 * Returns: list of all categories with counts and stats.
 *   { categories: [{ slug, title, count, totalStars, newCount24h, url }] }
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const all = repos as Repo[]
  const cutoff = Date.now() - 24 * 60 * 60 * 1000

  const map = new Map<
    string,
    { slug: string; title: string; count: number; totalStars: number; newCount24h: number }
  >()

  for (const r of all) {
    if (!map.has(r.slug)) {
      map.set(r.slug, {
        slug: r.slug,
        title: r.category,
        count: 0,
        totalStars: 0,
        newCount24h: 0
      })
    }
    const c = map.get(r.slug)!
    c.count += 1
    c.totalStars += r.stars ?? 0
    if (r.addedAt && new Date(r.addedAt).getTime() > cutoff) c.newCount24h += 1
  }

  const categories = [...map.values()]
    .map((c) => ({
      ...c,
      url: `https://mutimind-tracker.vercel.app/tracker/${c.slug}`
    }))
    .sort((a, b) => b.count - a.count)

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  return res.status(200).json({
    total: categories.length,
    totalRepos: all.length,
    totalNew24h: all.filter(
      (r) => r.addedAt && new Date(r.addedAt).getTime() > cutoff
    ).length,
    categories
  })
}
