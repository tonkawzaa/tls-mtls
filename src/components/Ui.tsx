import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import {
  Check,
  Copy,
  Database,
  FileBadge,
  Info,
  KeyRound,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { concepts, certificates, type ConceptId, type Level } from '../data/lessons'
export function Button({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`button ${className}`} {...props}>
      {children}
    </button>
  )
}
export function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
  labels,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  labels?: Partial<Record<T, string>>
}) {
  return (
    <div className="segment" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          className={value === option ? 'selected' : ''}
          onClick={() => onChange(option)}
        >
          {labels?.[option] ?? option}
        </button>
      ))}
    </div>
  )
}
const conceptIcons: Record<ConceptId, LucideIcon> = {
  serverCert: FileBadge,
  clientCert: FileBadge,
  clientPrivate: KeyRound,
  serverPrivate: KeyRound,
  publicKey: FileBadge,
  root: Landmark,
  serverCA: Landmark,
  clientCA: Landmark,
  keyStore: Database,
  trustStore: Database,
  catTrustStore: Database,
  catKeyStore: Database,
  session: LockKeyhole,
}
export type Inspect = (id: ConceptId) => void
export function ConceptNode({
  id,
  inspect,
  label,
  detail,
  className = '',
}: {
  id: ConceptId
  inspect: Inspect
  label?: string
  detail?: string
  className?: string
}) {
  const Icon = conceptIcons[id]
  return (
    <button
      type="button"
      className={`concept-node ${concepts[id].color} ${className}`}
      onClick={() => inspect(id)}
    >
      <Icon aria-hidden="true" />
      <span>
        <strong>{label ?? concepts[id].title}</strong>
        {detail ? <small>{detail}</small> : null}
      </span>
      <span className="node-arrow" aria-hidden="true">
        ›
      </span>
    </button>
  )
}
export function Note({
  children,
  tone = 'blue',
  icon: Icon = Info,
}: {
  children: ReactNode
  tone?: string
  icon?: LucideIcon
}) {
  return (
    <div className={`note ${tone}`}>
      <Icon aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
export function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus('idle'), 2500)
  }
  return (
    <button className="copy-button" type="button" onClick={copy}>
      <span aria-live="polite">
        {status === 'copied' ? (
          <>
            <Check size={16} /> Copied!
          </>
        ) : status === 'error' ? (
          <>คัดลอกไม่ได้ — เลือกข้อความแทน</>
        ) : (
          <>
            <Copy size={16} /> Copy
          </>
        )}
      </span>
    </button>
  )
}
export function ConceptDialog({
  id,
  level,
  close,
  inspect,
}: {
  id: ConceptId | null
  level: Level
  close: () => void
  inspect: Inspect
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (id && !ref.current?.open) ref.current?.showModal()
    else if (!id) ref.current?.close()
  }, [id])
  const content = id ? concepts[id] : null
  const Icon = id ? conceptIcons[id] : Info
  return (
    <dialog
      ref={ref}
      className="concept-dialog"
      onClose={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      aria-labelledby="concept-title"
    >
      <div className="dialog-content">
        {content && id ? (
          <>
            <div className="dialog-heading">
              <div className={`concept-symbol ${content.color}`}>
                <Icon />
              </div>
              <Button className="icon-button" aria-label="Close inspector" onClick={close}>
                <X />
              </Button>
            </div>
            <h2 id="concept-title">{content.title}</h2>
            <p className="analogy">{content.analogy}</p>
            <p>{content.text}</p>
            {level === 'Advanced' ? <Note>{content.advanced}</Note> : null}
            {id === 'serverCert' || id === 'clientCert' ? (
              <dl className="certificate-details">
                {Object.entries(certificates[id]).map(([field, value]) => (
                  <div key={field}>
                    <dt>{field}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {id.toLowerCase().includes('private') ? (
              <>
                <Note tone="red" icon={KeyRound}>
                  <strong>Private Key ต้องอยู่กับเจ้าของ</strong>
                  <p>ไม่ส่ง · ไม่แชร์ · ไม่ commit ลง Git</p>
                </Note>
                <ConceptNode id="publicKey" inspect={inspect} detail="กุญแจสำหรับตรวจลายมือชื่อ" />
              </>
            ) : null}
            {id === 'keyStore' || id === 'catKeyStore' ? (
              <div className="store-contents">
                <ConceptNode
                  id={id === 'keyStore' ? 'clientCert' : 'serverCert'}
                  inspect={inspect}
                />
                <ConceptNode
                  id={id === 'keyStore' ? 'clientPrivate' : 'serverPrivate'}
                  inspect={inspect}
                />
                <ConceptNode id={id === 'keyStore' ? 'clientCA' : 'serverCA'} inspect={inspect} />
              </div>
            ) : null}
            {id === 'trustStore' || id === 'catTrustStore' ? (
              <ConceptNode id="root" inspect={inspect} detail="Trusted CA · Local trust anchor" />
            ) : null}
            <Button className="primary dialog-done" onClick={close}>
              <Check size={18} /> เข้าใจแล้ว
            </Button>
          </>
        ) : null}
      </div>
    </dialog>
  )
}
export function SecurityReminder({ inspect }: { inspect: Inspect }) {
  return (
    <button className="security-reminder" type="button" onClick={() => inspect('clientPrivate')}>
      <KeyRound size={22} />
      <span>
        <strong>Certificate ≠ Private Key</strong>
        <small>Certificate แชร์ได้ · Private Key ต้องเก็บเป็นความลับ</small>
      </span>
    </button>
  )
}
export function TrustMark({ children }: { children: ReactNode }) {
  return (
    <span className="trust-mark">
      <ShieldCheck size={17} />
      {children}
    </span>
  )
}
