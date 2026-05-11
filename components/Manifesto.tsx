import React from 'react'

type Stage = {
  phase: string
  phaseEn: string
  title: string
  items: string[]
  hint?: string
  accent: string
}

const STAGES: Stage[] = [
  {
    phase: '输入',
    phaseEn: 'INPUT',
    title: '资源摄入',
    items: ['视频输入', '资源输入', '原始素材汇流'],
    hint: '广撒网 · 不挑食',
    accent: '#60a5fa'
  },
  {
    phase: '转化',
    phaseEn: 'TRANSFORM',
    title: '深度吸收',
    items: ['术语表 / 概念', '历史演变', '趣味故事', '标准流程 + 扩展点'],
    hint: '全局体系（地图）→ 局部细节（深度内化）',
    accent: '#93c5fd'
  },
  {
    phase: '输出',
    phaseEn: 'OUTPUT',
    title: '工具放大',
    items: ['现用工具组合', '可见成品', '多巴胺反馈'],
    hint: '看见产物 · 强化循环',
    accent: '#3b82f6'
  }
]

export const Manifesto: React.FC = () => (
  <section className="mm-manifesto">
    <div className="mm-manifesto-hero">
      <div className="mm-manifesto-eyebrow">核心理念 · CORE PHILOSOPHY</div>
      <h1 className="mm-manifesto-title">
        <span className="mm-word">输入</span>
        <span className="mm-arrow">→</span>
        <span className="mm-word">转化</span>
        <span className="mm-arrow">→</span>
        <span className="mm-word">输出</span>
      </h1>
      <div className="mm-manifesto-sub">高效循环 · 把世界喂给自己，再用工具吐回去</div>
    </div>

    <div className="mm-manifesto-grid">
      {STAGES.map((s, i) => (
        <article
          key={s.phase}
          className="mm-stage-card"
          style={{ '--accent': s.accent } as React.CSSProperties}
        >
          <header className="mm-stage-head">
            <div className="mm-stage-num">0{i + 1}</div>
            <div className="mm-stage-en">{s.phaseEn}</div>
          </header>

          <div className="mm-stage-phase">{s.phase}</div>
          <div className="mm-stage-subtitle">{s.title}</div>

          <ul className="mm-stage-list">
            {s.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {s.hint && <div className="mm-stage-hint">{s.hint}</div>}
        </article>
      ))}
    </div>

    <div className="mm-manifesto-loop">
      <span className="mm-loop-text">高效循环</span>
      <span className="mm-loop-cycle">⟳</span>
      <span className="mm-loop-en">Input · Transform · Output</span>
    </div>
  </section>
)

export default Manifesto
