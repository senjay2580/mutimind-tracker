# MutiMind Tracker — Public API

Public read-only API for AI agents (and humans) to discover, search, and analyze the tracked open-source projects.

- Base URL: `https://mutimind-tracker.vercel.app`
- CORS: open (`Access-Control-Allow-Origin: *`)
- Auth: none

Self-discover via `GET /api` — returns the schema of all endpoints.

## Endpoints

### `GET /api/categories`

List all categories with counts and 24h-new counts.

```bash
curl https://mutimind-tracker.vercel.app/api/categories
```

Response: `{ total, totalRepos, totalNew24h, categories: [{ slug, title, count, totalStars, newCount24h, url }] }`

---

### `GET /api/repos`

List / filter all repos.

| Param | Type | Default | Notes |
|---|---|---|---|
| `slug` | string | — | Filter by category slug |
| `lang` | string | — | Substring match on language |
| `minStars` | number | — | Repos with stars ≥ N |
| `q` | string | — | Keyword on name/desc/category |
| `newOnly` | `1` | — | Only last 24h additions |
| `limit` | number | 100 | Max 500 |
| `offset` | number | 0 | Pagination |
| `fields` | csv | all | Project specific fields |

```bash
curl 'https://mutimind-tracker.vercel.app/api/repos?slug=cli-agent&minStars=1000&limit=20'
curl 'https://mutimind-tracker.vercel.app/api/repos?q=mcp&fields=name,url,stars'
```

---

### `GET /api/search?q=<keyword>&limit=20`

Fast keyword search (no LLM, score-ranked).

```bash
curl 'https://mutimind-tracker.vercel.app/api/search?q=rag'
```

Response: `{ query, count, items: [{ score, name, url, stars, category, ... }] }`

---

### `GET /api/recent?hours=24&limit=50`

Recently added repos (by git-log addedAt).

```bash
curl 'https://mutimind-tracker.vercel.app/api/recent?hours=72'
```

Response: `{ since, windowHours, count, items: [...] }`

---

### `POST /api/ask`

AI recommendation (DeepSeek + full library context). Best for natural-language queries.

```bash
curl -X POST https://mutimind-tracker.vercel.app/api/ask \
  -H 'Content-Type: application/json' \
  -d '{"query":"找一个能跑在手机上的 LLM"}'
```

Response: `{ answer: <markdown>, sources: [{ name, url, category }] }`

---

### `POST /api/category-wiki`

AI deep-analysis of one category — 5-section structured wiki (是什么 / 如何用 / 同类对比 / 应用领域 / 活跃度).

```bash
curl -X POST https://mutimind-tracker.vercel.app/api/category-wiki \
  -H 'Content-Type: application/json' \
  -d '{"slug":"cli-agent"}'
```

Response: `{ wiki: <markdown>, category, slug, itemCount }`

---

### `GET /api`

Self-documenting endpoint index.

```bash
curl https://mutimind-tracker.vercel.app/api
```

## Cache

Static endpoints (`/api/repos`, `/api/categories`, `/api/recent`, `/api/search`) are cached at the Vercel edge for 2-5 minutes with stale-while-revalidate. AI endpoints (`/api/ask`, `/api/category-wiki`) are not cached — each call hits DeepSeek.

## Rate limits

No hard rate limit currently. Be reasonable. AI endpoints incur DeepSeek cost — please don't loop them in tight cycles.
