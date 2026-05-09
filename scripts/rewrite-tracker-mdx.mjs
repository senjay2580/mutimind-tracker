// Inject RepoList into each tracker mdx while keeping the original tables
// hidden via a `mm-source-data` wrapper. The hidden tables are still parsed
// by build-search-index.mjs to produce lib/repos.json.
//
// Run: node scripts/rewrite-tracker-mdx.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRACKER = resolve(__dirname, '../pages/tracker')

const meta = readFileSync(resolve(TRACKER, '_meta.ts'), 'utf8')
const titleMap = {}
for (const m of meta.matchAll(/'([a-z0-9-]+)'\s*:\s*'([^']+)'/g)) titleMap[m[1]] = m[2]

const files = readdirSync(TRACKER).filter((f) => f.endsWith('.mdx'))

for (const file of files) {
  const slug = file.replace('.mdx', '')
  const title = titleMap[slug] || slug
  const raw = readFileSync(resolve(TRACKER, file), 'utf8')

  // Strip frontmatter + the leading `# Title` line; keep the rest as the data body.
  let body = raw
  const fmMatch = body.match(/^---\n[\s\S]*?\n---\n+/)
  if (fmMatch) body = body.slice(fmMatch[0].length)
  const h1Match = body.match(/^#\s+[^\n]*\n+/)
  if (h1Match) body = body.slice(h1Match[0].length)

  // If file already uses RepoList (idempotent re-run), skip rewriting body.
  if (/<RepoList\s/.test(body)) continue

  const out =
    `---\ntitle: ${JSON.stringify(title)}\n---\n\n` +
    `import RepoList from '../../components/RepoList'\n\n` +
    `# ${title}\n\n` +
    `<RepoList slug="${slug}" />\n\n` +
    `{/* ── 数据源（隐藏，构建时由 scripts/build-search-index.mjs 抽取） ── */}\n\n` +
    `<div className="mm-source-data">\n\n` +
    body.trim() +
    `\n\n</div>\n`

  writeFileSync(resolve(TRACKER, file), out, 'utf8')
  console.log(`✓ ${file}`)
}
console.log(`Done. ${files.length} files updated.`)
