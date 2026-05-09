// Build-time: extract all repos from pages/tracker/*.mdx → lib/repos.json
// Used by /api/ask for retrieval before calling DeepSeek.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const TRACKER = resolve(ROOT, 'pages/tracker')
const OUT = resolve(ROOT, 'lib/repos.json')

// slug → category title (parsed from _meta.ts via regex)
const metaTxt = readFileSync(resolve(TRACKER, '_meta.ts'), 'utf8')
const titleMap = {}
for (const m of metaTxt.matchAll(/'([a-z0-9-]+)'\s*:\s*'([^']+)'/g)) {
  titleMap[m[1]] = m[2]
}

const repos = []
const files = readdirSync(TRACKER).filter((f) => f.endsWith('.mdx'))

const stripMd = (s) =>
  s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

for (const file of files) {
  const slug = file.replace('.mdx', '')
  const category = titleMap[slug] || slug
  const txt = readFileSync(resolve(TRACKER, file), 'utf8')

  // Pattern A: markdown table rows. Detect URL column and last-column description.
  for (const line of txt.split('\n')) {
    if (!line.startsWith('|') || line.includes('---')) continue
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((s) => s.trim())
    if (cells.length < 3) continue
    if (cells[0] === '项目名称' || cells[0] === '项目名' || cells[0] === '') continue
    const urlCell = cells.find((c) => /https:\/\/github\.com\//.test(c))
    if (!urlCell) continue
    const urlMatch = urlCell.match(/https:\/\/github\.com\/[a-zA-Z0-9._/-]+/)
    if (!urlMatch) continue
    const name = cells[0].replace(/[*`]/g, '').trim()
    const description = stripMd(cells[cells.length - 1]).slice(0, 700)
    if (name && urlMatch[0]) {
      repos.push({ name, url: urlMatch[0], category, slug, description })
    }
  }

  // Pattern B: card style — `## [name](url)` followed by paragraph(s)
  const cardRe =
    /^## \[([^\]]+)\]\((https:\/\/github\.com\/[^)]+)\)\s*\n+([\s\S]*?)(?=\n^## |\n*$)/gm
  for (const m of txt.matchAll(cardRe)) {
    const name = m[1].trim()
    const url = m[2].trim()
    const description = stripMd(m[3]).slice(0, 700)
    repos.push({ name, url, category, slug, description })
  }
}

// Dedupe by url
const seen = new Set()
const unique = repos.filter((r) => {
  if (seen.has(r.url)) return false
  seen.add(r.url)
  return true
})

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(unique, null, 2), 'utf8')
console.log(`✓ Indexed ${unique.length} repos (from ${files.length} categories) → lib/repos.json`)
