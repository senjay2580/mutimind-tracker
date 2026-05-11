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
  subcategory?: string
  slug: string
  description: string
  addedAt?: string
}

/**
 * GET /api/repos
 *
 * Query params (all optional):
 *   slug     — filter by category slug (e.g. cli-agent)
 *   lang     — filter by language (case-insensitive substring)
 *   minStars — number, repos with stars >= N (or null stars excluded)
 *   q        — keyword (matches name/description/category, case-insensitive)
 *   newOnly  — '1' to filter to last 24h additions
 *   limit    — max results (default 100, hard cap 500)
 *   offset   — pagination offset (default 0)
 *   fields   — comma list of fields to include (default all)
 *
 * Returns: { total, count, offset, items: Repo[] }
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const all = repos as Repo[]
  const {
    slug,
    lang,
    minStars,
    q,
    newOnly,
    limit = '100',
    offset = '0',
    fields
  } = req.query as Record<string, string>

  let items = all

  if (slug) items = items.filter((r) => r.slug === slug)
  if (lang) {
    const l = lang.toLowerCase()
    items = items.filter((r) => (r.lang || '').toLowerCase().includes(l))
  }
  if (minStars) {
    const n = Number(minStars)
    if (Number.isFinite(n)) items = items.filter((r) => (r.stars ?? -1) >= n)
  }
  if (q) {
    const needle = q.toLowerCase()
    items = items.filter((r) =>
      (r.name + ' ' + r.description + ' ' + r.category)
        .toLowerCase()
        .includes(needle)
    )
  }
  if (newOnly === '1') {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    items = items.filter(
      (r) => r.addedAt && new Date(r.addedAt).getTime() > cutoff
    )
  }

  const total = items.length
  const off = Math.max(0, Number(offset) || 0)
  const lim = Math.min(500, Math.max(1, Number(limit) || 100))
  let page = items.slice(off, off + lim)

  if (fields) {
    const want = new Set(fields.split(',').map((s) => s.trim()))
    page = page.map((r) => {
      const out: Record<string, any> = {}
      for (const k of want) if (k in r) out[k] = (r as any)[k]
      return out as Repo
    })
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  return res.status(200).json({
    total,
    count: page.length,
    offset: off,
    limit: lim,
    items: page
  })
}
