import React from 'react'

const LINES: string[] = [
  '术语表/概念',
  '历史演变',
  '趣味xxx',
  '视频输入阶段',
  '全局体系（xxx地图）到局部细节（深度转化自身的思维吸收）',
  '标准流程和扩展点',
  '资源输入阶段',
  '输出阶段（利用现用工具产生多巴胺）',
  '高效循环 输入到输出'
]

export const Manifesto: React.FC = () => (
  <section className="mm-manifesto">
    {LINES.map((line, i) => (
      <div
        key={i}
        className={`mm-line${i === LINES.length - 1 ? ' mm-line-climax' : ''}`}
      >
        {line}
      </div>
    ))}
  </section>
)

export default Manifesto
