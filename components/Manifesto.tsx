import React from 'react'

type Group = {
  num: string
  items: string[]
}

const GROUPS: Group[] = [
  {
    num: '01',
    items: ['视频输入阶段', '资源输入阶段']
  },
  {
    num: '02',
    items: [
      '术语表/概念',
      '历史演变',
      '趣味xxx',
      '全局体系（xxx地图）到局部细节（深度转化自身的思维吸收）',
      '标准流程和扩展点'
    ]
  },
  {
    num: '03',
    items: ['输出阶段（利用现用工具产生多巴胺）']
  }
]

export const Manifesto: React.FC = () => (
  <section className="mm-manifesto">
    <div className="mm-manifesto-hero">
      <div className="mm-manifesto-eyebrow">核心理念</div>
      <h1 className="mm-manifesto-title">
        <span className="mm-word">输入</span>
        <span className="mm-arrow">→</span>
        <span className="mm-word">输出</span>
      </h1>
      <div className="mm-manifesto-sub">高效循环 · 输入到输出</div>
    </div>

    <div className="mm-manifesto-flow">
      {GROUPS.map((g) => (
        <div className="mm-flow-group" key={g.num}>
          <div className="mm-flow-num">{g.num}</div>
          <ul className="mm-flow-list">
            {g.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
)

export default Manifesto
