// Build-time: extract all repos from pages/tracker/*.mdx → lib/repos.json
// Captures: name, owner, url, stars, updated, lang, license, category, slug, description
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const TRACKER = resolve(ROOT, 'pages/tracker')
const OUT = resolve(ROOT, 'lib/repos.json')

const metaTxt = readFileSync(resolve(TRACKER, '_meta.ts'), 'utf8')
const titleMap = {}
for (const m of metaTxt.matchAll(/'([a-z0-9-]+)'\s*:\s*'([^']+)'/g)) {
  titleMap[m[1]] = m[2]
}

const stripMd = (s) =>
  s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

const ownerFromUrl = (url) => {
  const m = url.match(/github\.com\/([^/]+)\/[^/]+/)
  return m ? m[1] : ''
}

const parseStars = (s) => {
  if (!s) return null
  const cleaned = String(s).replace(/[★,\s]/g, '').toLowerCase()
  if (/^\d+(\.\d+)?k$/.test(cleaned)) return Math.round(parseFloat(cleaned) * 1000)
  const n = Number(cleaned)
  return Number.isFinite(n) && n > 0 ? n : null
}

// "2026-04-05" or "2026-04" → "2026-04-05"
const normalizeDate = (s) => {
  if (!s) return null
  const t = String(s).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  if (/^\d{4}-\d{2}$/.test(t)) return t + '-01'
  return null
}

const repos = []
const files = readdirSync(TRACKER).filter((f) => f.endsWith('.mdx'))

for (const file of files) {
  const slug = file.replace('.mdx', '')
  const category = titleMap[slug] || slug
  const txt = readFileSync(resolve(TRACKER, file), 'utf8')

  // ---------- Pattern A: markdown table rows ----------
  for (const line of txt.split('\n')) {
    if (!line.startsWith('|') || line.includes('---')) continue
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((s) => s.trim())
    if (cells.length < 3) continue
    const first = cells[0].replace(/[*`]/g, '').trim()
    if (!first || first === '项目名称' || first === '项目名') continue

    const urlIdx = cells.findIndex((c) => /https:\/\/github\.com\//.test(c))
    if (urlIdx < 0) continue
    const urlMatch = cells[urlIdx].match(/https:\/\/github\.com\/[a-zA-Z0-9._/-]+/)
    if (!urlMatch) continue
    const url = urlMatch[0].replace(/[).,;]+$/, '')

    const name = first
    const owner = ownerFromUrl(url)

    // After url cell: stars (3rd col commonly), maybe date, last is description
    const after = cells.slice(urlIdx + 1)
    let stars = null
    let updated = null
    let description = ''

    if (after.length === 1) {
      description = after[0]
    } else if (after.length === 2) {
      stars = parseStars(after[0])
      description = after[1]
    } else {
      stars = parseStars(after[0])
      updated = normalizeDate(after[1])
      description = after[after.length - 1]
    }

    repos.push({
      name,
      owner,
      url,
      stars,
      updated,
      lang: null,
      license: null,
      category,
      slug,
      description: stripMd(description).slice(0, 1200)
    })
  }

  // ---------- Pattern B: card style — `## [name](url)` + optional <RepoMeta /> + paragraph ----------
  const cardRe =
    /^## \[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\)\s*\n+([\s\S]*?)(?=\n^## |\n*$)/gm
  for (const m of txt.matchAll(cardRe)) {
    const name = m[1].trim()
    const url = m[2].trim().replace(/[).,;]+$/, '')
    let body = m[3]

    let stars = null
    let updated = null
    let lang = null
    let license = null

    const metaMatch = body.match(/<RepoMeta\b([^>]*)\/?>([\s\S]*?<\/RepoMeta>)?/)
    if (metaMatch) {
      const attrs = metaMatch[1]
      const sm = attrs.match(/stars=\{(\d+)\}/) || attrs.match(/stars="(\d+)"/)
      if (sm) stars = parseInt(sm[1], 10)
      const um = attrs.match(/updated="([^"]+)"/)
      if (um) updated = normalizeDate(um[1])
      const lm = attrs.match(/lang="([^"]+)"/)
      if (lm) lang = lm[1]
      const lic = attrs.match(/license="([^"]+)"/)
      if (lic) license = lic[1]
      body = body.replace(metaMatch[0], '')
    }

    repos.push({
      name,
      owner: ownerFromUrl(url),
      url,
      stars,
      updated,
      lang,
      license,
      category,
      slug,
      description: stripMd(body).slice(0, 1200)
    })
  }
}

// Dedupe by url, keeping the one with most metadata
const map = new Map()
for (const r of repos) {
  const cur = map.get(r.url)
  if (!cur) {
    map.set(r.url, r)
    continue
  }
  // Merge: prefer non-null
  map.set(r.url, {
    ...cur,
    stars: cur.stars ?? r.stars,
    updated: cur.updated ?? r.updated,
    lang: cur.lang ?? r.lang,
    license: cur.license ?? r.license,
    description: cur.description.length >= r.description.length ? cur.description : r.description
  })
}
const unique = [...map.values()]

// Sort within each slug by stars desc (null at end)
unique.sort((a, b) => {
  if (a.slug !== b.slug) return 0
  const sa = a.stars ?? -1
  const sb = b.stars ?? -1
  return sb - sa
})

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(unique, null, 2), 'utf8')

const withStars = unique.filter((r) => r.stars).length
const withDate = unique.filter((r) => r.updated).length
console.log(
  `✓ Indexed ${unique.length} repos (stars: ${withStars}, dates: ${withDate}) → lib/repos.json`
)
