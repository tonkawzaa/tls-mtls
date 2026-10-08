import { useEffect, useId, useRef, type RefObject } from 'react'
import { GitBranch, ShieldCheck, X } from 'lucide-react'
import {
  buildDiagram,
  type DiagramContext,
  type DiagramNode,
  type DiagramSection,
} from '../data/diagrams'
import { Button, Note } from './Ui'

// SVG labels stay short; the complete text is available in the ordered explanation.
function wrapLabel(
  text: string,
  width: number,
  fontSize: number,
  limit = 2,
): string[] {
  const lines: string[] = []
  let line = ''
  let used = 0
  const segments = new Intl.Segmenter('th', { granularity: 'word' }).segment(
    text,
  )
  for (const { segment } of segments) {
    const parts =
      segment.length * fontSize * 0.56 > width ? [...segment] : [segment]
    for (const part of parts) {
      const size = [...part].reduce(
        (sum, char) =>
          sum +
          fontSize *
            (/\s/.test(char) ? 0.3 : /[A-ZMW@]/.test(char) ? 0.7 : 0.56),
        0,
      )
      if (used + size > width && line) {
        lines.push(line.trim())
        if (lines.length === limit) {
          lines[limit - 1] = lines[limit - 1].replace(/[\s.,;]+$/, '') + '…'
          return lines
        }
        line = ''
        used = 0
      }
      line += part
      used += size
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

function SvgCard({
  node,
  index,
  x,
  y,
}: {
  node: DiagramNode
  index: number
  x: number
  y: number
}) {
  const title = wrapLabel(node.title, 250, 17)
  const detail = wrapLabel(
    node.blocked ? 'ขั้นนี้ไปต่อไม่ได้ · API ถูกบล็อก' : node.detail,
    250,
    13,
  )
  return (
    <g
      transform={`translate(${x} ${y})`}
      className={`diagram-node ${node.tone}${node.blocked ? ' diagram-blocked' : ''}`}
    >
      <rect className="diagram-card" width="296" height="152" rx="14" />
      <rect
        className="diagram-card-accent"
        x="1"
        y="16"
        width="4"
        height="120"
        rx="2"
      />
      <circle className="diagram-number" cx="30" cy="29" r="14" />
      <text x="30" y="34" textAnchor="middle" className="diagram-number-label">
        {index + 1}
      </text>
      <text x="53" y="34" className="diagram-tag">
        {node.blocked ? 'ไม่ดำเนินการ' : node.tag}
      </text>
      <text x="22" y="66" className="diagram-node-title">
        {title.map((line, i) => (
          <tspan x="22" dy={i ? 23 : 0} key={i}>
            {line}
          </tspan>
        ))}
      </text>
      <text x="22" y="113" className="diagram-node-detail">
        {detail.map((line, i) => (
          <tspan x="22" dy={i ? 19 : 0} key={i}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function FlowSvg({
  section,
  vertical,
}: {
  section: DiagramSection
  vertical: boolean
}) {
  const marker = useId().replace(/:/g, '')
  const linked = section.linked !== false
  const position = (index: number) => {
    if (vertical) return { x: 18, y: 18 + index * 190 }
    const row = Math.floor(index / 3)
    const col = linked && row % 2 ? 2 - (index % 3) : index % 3
    return { x: 18 + col * 334, y: 18 + row * 190 }
  }
  const height =
    36 +
    (vertical ? section.nodes.length : Math.ceil(section.nodes.length / 3)) *
      190 -
    38
  return (
    <svg
      className={vertical ? 'diagram-svg-mobile' : 'diagram-svg-desktop'}
      viewBox={`0 0 ${vertical ? 332 : 1000} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {['normal', 'blocked'].map((state) => (
          <marker
            key={state}
            id={`${marker}-${state}`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path
              d="M0 0 L8 4 L0 8 Z"
              fill={state === 'blocked' ? 'var(--red)' : 'var(--muted)'}
            />
          </marker>
        ))}
      </defs>
      {linked
        ? section.nodes.slice(0, -1).map((item, index) => {
            const from = position(index),
              to = position(index + 1)
            const down = from.y !== to.y
            const right = to.x > from.x
            const x1 = down ? from.x + 148 : from.x + (right ? 296 : 0)
            const y1 = down ? from.y + 152 : from.y + 76
            const x2 = down ? to.x + 148 : to.x + (right ? -3 : 299)
            const y2 = down ? to.y - 3 : to.y + 76
            return (
              <path
                key={item.id}
                d={`M${x1} ${y1} L${x2} ${y2}`}
                className={`diagram-connector${section.nodes[index + 1].blocked ? ' diagram-connector-blocked' : ''}`}
                markerEnd={`url(#${marker}-${section.nodes[index + 1].blocked ? 'blocked' : 'normal'})`}
              />
            )
          })
        : null}
      {section.nodes.map((item, index) => (
        <SvgCard key={item.id} node={item} index={index} {...position(index)} />
      ))}
    </svg>
  )
}

export function DiagramDialog({
  context,
  close,
  returnFocus,
}: {
  context: DiagramContext
  close: () => void
  returnFocus: RefObject<HTMLButtonElement | null>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const summaryId = useId()
  const diagram = buildDiagram(context)
  useEffect(() => {
    const dialog = ref.current
    const trigger = returnFocus.current
    const previousOverflow = document.body.style.overflow
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [returnFocus])
  return (
    <dialog
      ref={ref}
      className="diagram-dialog"
      aria-labelledby={titleId}
      aria-describedby={summaryId}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="diagram-dialog-shell">
        <header className="diagram-dialog-header">
          <div>
            <span className="diagram-eyebrow">
              <GitBranch size={16} /> แผนภาพการทำงาน
            </span>
            <h2 id={titleId}>{diagram.title}</h2>
            <div className="diagram-context">
              <span>{context.mode}</span>
              <span>{context.level}</span>
              {context.level === 'Advanced' ? (
                <span>TLS {context.protocol}</span>
              ) : (
                <span>Conceptual flow</span>
              )}
            </div>
          </div>
          <Button
            autoFocus
            className="icon-button"
            aria-label="ปิดแผนภาพ"
            onClick={close}
          >
            <X size={22} />
          </Button>
        </header>
        <div className="diagram-dialog-body">
          <p id={summaryId} className="diagram-summary">
            {diagram.summary}
          </p>
          {diagram.warning ? (
            <Note tone="red">
              <strong>{diagram.warning.title}</strong>
              <p>{diagram.warning.explanation}</p>
              <p>
                <strong>แนวทางตรวจสอบ:</strong> {diagram.warning.fix}
              </p>
            </Note>
          ) : null}
          {diagram.sections.map((section) => (
            <section key={section.id} className="diagram-section">
              <div className="diagram-section-heading">
                <h3>{section.title}</h3>
                <span>
                  {section.nodes.length}{' '}
                  {section.linked === false ? 'องค์ประกอบ' : 'ขั้นตอน'}
                </span>
              </div>
              <p>{section.note}</p>
              <div
                className="diagram-canvas"
                role="img"
                aria-label={`${section.title} · ${section.note}`}
              >
                <FlowSvg section={section} vertical={false} />
                <FlowSvg section={section} vertical />
              </div>
              <details className="diagram-explanations">
                <summary>
                  อ่านคำอธิบาย
                  {section.linked === false ? 'แต่ละองค์ประกอบ' : 'ทีละขั้น'}
                </summary>
                <ol>
                  {section.nodes.map((item) => (
                    <li
                      key={item.id}
                      className={item.blocked ? 'blocked-explanation' : ''}
                    >
                      <strong>{item.title}</strong>
                      <p>
                        {item.blocked
                          ? 'ไม่ดำเนินการ เนื่องจาก handshake หยุดที่ blocker ก่อนหน้า · '
                          : ''}
                        {item.detail}
                      </p>
                    </li>
                  ))}
                </ol>
              </details>
            </section>
          ))}
          <Note tone="slate" icon={ShieldCheck}>
            ข้อมูลสมมติสำหรับการเรียนรู้ · Private Key อยู่กับเจ้าของ · API ใช้
            symmetric traffic keys หลัง handshake สำเร็จ
          </Note>
        </div>
      </div>
    </dialog>
  )
}
