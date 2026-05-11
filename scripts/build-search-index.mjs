// Build-time: extract all repos from pages/tracker/*.mdx → lib/repos.json
// Captures: name, owner, url, stars, updated, lang, license, category, slug, description, addedAt
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

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
  if (m) return m[1]
  // For non-GitHub URLs (sites), leave owner empty — we'll just show the host inline.
  return ''
}

const isGithubUrl = (url) => /^https:\/\/github\.com\//.test(url)

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

// Categories that can include arbitrary site URLs (not just GitHub repos).
// For these slugs the parser accepts any http(s) URL.
const SITE_SLUGS = new Set(['aggregation', 'cc-skills-marketplaces', 'free-apis-index'])
const ANY_URL_RE = /https?:\/\/[^\s|)\]'">]+/
const GH_URL_RE = /https:\/\/github\.com\/[a-zA-Z0-9._/-]+/

for (const file of files) {
  const slug = file.replace('.mdx', '')
  const category = titleMap[slug] || slug
  const txt = readFileSync(resolve(TRACKER, file), 'utf8')
  const allowSites = SITE_SLUGS.has(slug)
  const URL_RE = allowSites ? ANY_URL_RE : GH_URL_RE

  // Track the current `### subcategory` heading while walking the file.
  let currentSub = ''

  // ---------- Pattern A: markdown table rows ----------
  for (const line of txt.split('\n')) {
    // Subcategory tracking: ### resets to the new sub; ## (top section) resets to ''
    const subM = line.match(/^###\s+(.+?)\s*$/)
    if (subM) { currentSub = subM[1].trim(); continue }
    const h2M = line.match(/^##\s/)
    if (h2M) { currentSub = '' /* fall through, still parse line below */ }

    if (!line.startsWith('|') || line.includes('---')) continue
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((s) => s.trim())
    if (cells.length < 3) continue
    const first = cells[0].replace(/[*`]/g, '').trim()
    if (!first || first === '项目名称' || first === '项目名' || first === '名称') continue

    const urlIdx = cells.findIndex((c) => URL_RE.test(c))
    if (urlIdx < 0) continue
    const urlMatch = cells[urlIdx].match(URL_RE)
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
      subcategory: currentSub,
      slug,
      description: stripMd(description).slice(0, 1200)
    })
  }

  // ---------- Pattern C: bullet / quote / generic markdown link to GitHub ----------
  // `> [name](url) — desc` / `- [name](url) — desc` / inline `[name](url) — desc`
  const linkLineRe =
    /^\s*[-*>]?\s*\[([^\]]+)\]\((https:\/\/github\.com\/[a-zA-Z0-9._/-]+)\)([^\n]*)/gm
  for (const m of txt.matchAll(linkLineRe)) {
    const name = m[1].trim()
    const url = m[2].trim().replace(/[).,;]+$/, '')
    if (!name || !url) continue
    if (name.toLowerCase() === 'github 地址' || name.startsWith('http')) continue
    const after = stripMd(m[3]).replace(/^[—–\-:：]\s*/, '').trim()
    repos.push({
      name,
      owner: ownerFromUrl(url),
      url,
      stars: null,
      updated: null,
      lang: null,
      license: null,
      category,
      subcategory: '',
      slug,
      description: after.slice(0, 800)
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
      subcategory: '',
      slug,
      description: stripMd(body).slice(0, 1200)
    })
  }
}

// Dedupe by url. When same URL appears in multiple categories, prefer the
// "primary" home — the one with structured metadata (stars set), since that's
// where the user actually catalogued it. Fallback to first encountered.
const map = new Map()
for (const r of repos) {
  const cur = map.get(r.url)
  if (!cur) {
    map.set(r.url, r)
    continue
  }
  const curHasStars = cur.stars != null
  const newHasStars = r.stars != null
  // primary: entry with stars wins; if both or neither, keep cur
  const primary = !curHasStars && newHasStars ? r : cur
  const secondary = primary === r ? cur : r
  map.set(r.url, {
    ...primary,
    stars: primary.stars ?? secondary.stars,
    updated: primary.updated ?? secondary.updated,
    lang: primary.lang ?? secondary.lang,
    license: primary.license ?? secondary.license,
    description:
      primary.description.length >= secondary.description.length
        ? primary.description
        : secondary.description
  })
}
const unique = [...map.values()]

// ---------- addedAt: when each URL first appeared in pages/tracker via git ----------
// Strategy: parse `git log -p` for the last 14 days; for each commit's diff, find
// lines like `+## [name](url)` or `+| name | url | ...` — record earliest commit
// timestamp per URL. This skips items older than 14 days (treated as "not new").
const urlAddedAt = new Map() // url → ISO timestamp
try {
  const log = execSync(
    `git log --diff-filter=AM --since="14 days ago" --reverse --format="===COMMIT %aI" -p -- pages/tracker/`,
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  )
  let curTs = null
  for (const line of log.split('\n')) {
    if (line.startsWith('===COMMIT ')) { curTs = line.slice(10).trim(); continue }
    if (!line.startsWith('+') || line.startsWith('+++')) continue
    // strip leading +
    const body = line.slice(1)
    // Pattern: ## [name](url)
    const cardM = body.match(/^## \[[^\]]+\]\((https?:\/\/[^)]+)\)/)
    // Pattern: table row | name | url | ...
    const tableUrls = [...body.matchAll(/(https?:\/\/[^\s|)\]'">]+)/g)].map((m) => m[1])
    const candidates = []
    if (cardM) candidates.push(cardM[1])
    for (const u of tableUrls) candidates.push(u)
    for (const raw of candidates) {
      const u = raw.replace(/[).,;]+$/, '')
      if (!urlAddedAt.has(u) && curTs) urlAddedAt.set(u, curTs)
    }
  }
} catch (e) {
  console.warn('⚠ git log scan failed (no addedAt timestamps):', e.message)
}

for (const r of unique) {
  const t = urlAddedAt.get(r.url)
  if (t) r.addedAt = t
}

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
const withAdded = unique.filter((r) => r.addedAt).length
console.log(
  `✓ Indexed ${unique.length} repos (stars: ${withStars}, dates: ${withDate}, addedAt: ${withAdded}) → lib/repos.json`
)
