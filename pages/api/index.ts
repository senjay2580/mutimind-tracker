import type { NextApiRequest, NextApiResponse } from 'next'
import { applyCors } from '../../lib/cors'

const BASE = 'https://mutimind-tracker.vercel.app'

const ENDPOINTS = [
  {
    path: '/api/categories',
    method: 'GET',
    summary: '列出所有分类 + 项目数 + 总 star + 24h 新增数',
    params: {},
    example: `${BASE}/api/categories`
  },
  {
    path: '/api/repos',
    method: 'GET',
    summary: '列出/筛选所有项目',
    params: {
      slug: '分类 slug (如 cli-agent)',
      lang: '语言子串 (如 python)',
      minStars: '最少 star 数',
      q: '关键词 (匹配 name/description/category)',
      newOnly: '1 = 仅 24h 新增',
      limit: '默认 100，最大 500',
      offset: '分页偏移',
      fields: '逗号列表，按需返回字段'
    },
    example: `${BASE}/api/repos?slug=cli-agent&minStars=1000&limit=20`
  },
  {
    path: '/api/search',
    method: 'GET',
    summary: '关键词快速检索 (无 LLM, 词频打分)',
    params: {
      q: '搜索词 (>= 2 字符)',
      limit: '默认 20，最大 100'
    },
    example: `${BASE}/api/search?q=mcp&limit=10`
  },
  {
    path: '/api/recent',
    method: 'GET',
    summary: '最近 N 小时新增的项目',
    params: {
      hours: '回看小时数 (默认 24，最大 720)',
      limit: '默认 50，最大 500'
    },
    example: `${BASE}/api/recent?hours=72&limit=30`
  },
  {
    path: '/api/ask',
    method: 'POST',
    summary: 'AI 推荐 (DeepSeek + 全库, 适合自然语言问答)',
    params: { query: 'string, 2-500 字符' },
    body: { query: '推荐 2 个轻量好用的 RAG 框架' },
    example: `curl -X POST ${BASE}/api/ask -H 'Content-Type: application/json' -d '{"query":"找一个能跑在手机上的 LLM"}'`
  },
  {
    path: '/api/category-wiki',
    method: 'POST',
    summary: 'AI 深度分析单个分类 (5 段 wiki)',
    params: { slug: '分类 slug' },
    body: { slug: 'cli-agent' },
    example: `curl -X POST ${BASE}/api/category-wiki -H 'Content-Type: application/json' -d '{"slug":"cli-agent"}'`
  }
]

/**
 * GET /api  — Self-documenting API index
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (applyCors(req, res)) return
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=86400')
  return res.status(200).json({
    name: 'MutiMind Tracker Public API',
    base: BASE,
    docs: `${BASE}/api-docs`,
    repo: 'https://github.com/senjay2580/mutimind-tracker',
    cors: 'open (Access-Control-Allow-Origin: *)',
    auth: 'none (public read-only)',
    note: 'AI agents are encouraged to call these endpoints to discover, search and analyze tracked open-source projects.',
    endpoints: ENDPOINTS
  })
}
