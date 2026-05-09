# MutiMind · 优质开源项目追踪

精选 AI / Agent / RAG / 具身智能 / Claude Code Skills 等领域的优秀 GitHub 开源项目。

🌐 在线站点：https://mutimind.vercel.app

## 维护方式

- 数据源：本仓库 `pages/tracker/*.mdx`
- 自动化：通过 [github-tracker](https://github.com/senjay2580/dotclaude) skill 添加新条目，提交后 Vercel 自动部署
- 每个分类独立一个 mdx 文件，结构稳定，易扩展

## 本地开发

```bash
npm install
npm run dev          # localhost:3000
npm run build
```

## 添加新项目

1. 在 Claude Code 中调用 `github-tracker` skill：`add https://github.com/...`
2. skill 自动拉取 stars/desc/lang/license 并写入对应分类 mdx
3. `git push` → Vercel 自动构建上线（~30s）

## 分类约定

每个 H2 分类对应 `pages/tracker/<slug>.mdx` 一个文件。新增分类需同时更新 `pages/tracker/_meta.json`。
