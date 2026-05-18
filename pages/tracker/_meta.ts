// All tracker pages use layout:'full' to drop the right TOC sidebar.
const full = { theme: { layout: 'full' as const, toc: false } }

const titles: Record<string, string> = {
  'netdisk-tools': '网盘 & 下载工具',
  'ai-llm-core': 'AI/LLM 核心项目',
  'auto-research': '自主研究 & 自进化',
  'rag-orchestration': 'RAG & LLM 编排',
  'agent-frameworks': 'Agent 框架',
  'mobile': '手机开源项目',
  'html-to-ppt': 'HTML/Canvas 转 PPT',
  'cli-agent': 'CLI 工具汇聚 & AI Agent 集成',
  'vibe-coding': 'Vibe Coding & 开发工具',
  'tts': '语音合成 (TTS)',
  'video-ai': '视频 AI',
  'robotics': '机器人 & ROS2 生态',
  'automation-testing': '自动化 & 测试',
  'tutorials': '教程库 & 学习路径',
  'free-apis': '免费 API & 开发者资源',
  'cheatsheets': '速查手册 & 开发者参考',
  'vertical-agents': '垂直领域 Agent',
  'agent-cases': 'AI Agent 案例库 & 实战项目集合',
  'aggregation': '资源聚合 & 信息源',
  'free-apis-index': '免费 API 索引',
  'skills': 'Claude Code Skills',
  'agent-video-tools': 'Agent 视频制作方案',
  'dspy': 'DSPy',
  'prompt-engineering': 'Prompt 工程 & AI 资源精选',
  'info-sources': '高质量信息源 / RSS / 博客',
  'trend-signals': '趋势洞察 / 选题信号源',
  'network-tools': '网络工具',
  'software-collections': '软件集合',
  'browser-automation': '浏览器自动化',
  'desktop-automation': '桌面自动化'
}

export default Object.fromEntries(
  Object.entries(titles).map(([slug, title]) => [slug, { title, ...full }])
)
