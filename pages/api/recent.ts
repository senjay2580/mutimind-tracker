import type { NextApiRequest, NextApiResponse } from 'next'
import repos from '../../lib/repos.json'
import { applyCors } from '../../lib/cors'

type Repo = {
  name: string
  url: string
  stars: number | null
  category: string
  slug: string
  description: string
  addedAt?: string
}

/**
 * GET /api/recent?hours=24&limit=50
 *
 * Returns recently added repos to the tracker (by git log addedAt).
 *   { since, count, items: [...] }
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { hours = '24', limit = '50' } = req.query as Record<string, string>
  const h = Math.min(720, Math.max(1, Number(hours) || 24))
  const lim = Math.min(500, Math.max(1, Number(limit) || 50))
  const cutoff = Date.now() - h * 60 * 60 * 1000

  const items = (repos as Repo[])
    .filter((r) => r.addedAt && new Date(r.addedAt).getTime() > cutoff)
    .sort(
      (a, b) =>
        new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime()
    )
    .slice(0, lim)

  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
  return res.status(200).json({
    since: new Date(cutoff).toISOString(),
    windowHours: h,
    count: items.length,
    items
  })
}
