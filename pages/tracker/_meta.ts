// All tracker pages use layout:'full' to drop the right TOC sidebar.
const full = { theme: { layout: 'full' as const, toc: false } }

const titles: Record<string, string> = {
  'models': '开源大模型',
  'agents': 'Agent',
  'rag-orchestration': 'RAG & 知识库',
  'skills': 'Claude Code Skills',
  'cli-agent': 'CLI 工具 & 终端 Agent',
  'vibe-coding': 'Vibe Coding & 开发工具',
  'automation': '自动化（浏览器/桌面/测试）',
  'mobile': '手机 & 移动开源',
  'media-ai': 'AI 内容生成（视频/语音/PPT）',
  'robotics': '机器人 & 具身智能',
  'tutorials': '教程 & 学习路径',
  'aggregation': '资源聚合 & 信息源',
  'toolbox': '实用工具箱'
}

export default Object.fromEntries(
  Object.entries(titles).map(([slug, title]) => [slug, { title, ...full }])
)
