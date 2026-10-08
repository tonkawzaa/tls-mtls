import { useId, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  CircleX,
  FileBadge,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
} from 'lucide-react'
import type { Level, Mode, Protocol } from '../data/lessons'
import { STEP_DURATION, type Step } from '../lib/handshake'
import type { HandshakeController } from '../hooks/useHandshake'
import { Button, ConceptNode, Note, SecurityReminder, type Inspect } from './Ui'
export function ConnectionDiagram({
  controller,
  mode,
  level,
  protocol,
  inspect,
}: {
  controller: HandshakeController
  mode: Mode
  level: Level
  protocol: Protocol
  inspect: Inspect
}) {
  const { state, current, steps, failure } = controller
  const reduced = useReducedMotion()
  const markerId = useId().replaceAll(':', '')
  const secureIndex = steps.findIndex((s) => s.phase === 'secure')
  const secure = state.index >= secureIndex && !failure
  const finished = state.status === 'complete'
  const combinedApiStep = current.phase === 'request' && state.index === steps.length - 1
  const showingResponse = combinedApiStep && (finished || state.elapsed >= STEP_DURATION / 2)
  const displayed: Step = showingResponse
    ? { ...current, phase: 'response', direction: 'toClient', artifact: '200 OK · API Response' }
    : current
  const transferring = Boolean(displayed.direction) && state.status !== 'idle'
  const elapsedFraction = Math.min(state.elapsed / STEP_DURATION, 1)
  const fraction = reduced
    ? 0.5
    : combinedApiStep
      ? showingResponse
        ? (elapsedFraction - 0.5) * 2
        : elapsedFraction * 2
      : elapsedFraction
  const position = secure
    ? displayed.direction === 'toServer'
      ? 40 + fraction * 20
      : 60 - fraction * 20
    : displayed.direction === 'toServer'
      ? 26 + fraction * 48
      : 74 - fraction * 48
  const serverCheck =
    steps.findIndex((s) => s.phase === 'chain') >= 0
      ? steps.findIndex((s) => s.phase === 'chain')
      : steps.findIndex((s) => s.phase === 'serverValidate')
  const clientCheck = steps.findIndex((s) => s.phase === 'clientValidate')
  const catTrusted =
    state.index > serverCheck &&
    (!failure ||
      failure.field.startsWith('client') ||
      failure.field.startsWith('private') ||
      failure.field === 'keyMatches')
  const dogTrusted = mode === 'mTLS' && state.index > clientCheck && !failure
  const certificate = displayed.artifact?.includes('.crt')
  const packetStyle = {
    '--packet-position': `${position}%`,
    '--vertical-position': `${(displayed.direction === 'toServer' ? 28 : 72) + (displayed.direction === 'toServer' ? 1 : -1) * fraction * 44}%`,
  } as CSSProperties
  return (
    <div
      className={`connection-diagram ${secure ? 'is-secure' : ''} ${failure ? 'has-failed' : ''}`}
      data-testid="connection-diagram"
    >
      <div className="verification-caption">
        <span>
          <ShieldCheck size={18} /> dog verifies cat
        </span>
        {mode === 'mTLS' ? (
          <span>
            <ShieldCheck size={18} /> cat verifies dog
          </span>
        ) : null}
      </div>
      <svg
        className="connection-wires desktop-wire"
        viewBox="0 0 700 350"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={`arrow-${markerId}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path
              d="M0 0L10 5L0 10z"
              fill={
                failure
                  ? 'var(--red)'
                  : secure
                    ? 'var(--green)'
                    : certificate
                      ? 'var(--gold)'
                      : 'var(--muted)'
              }
            />
          </marker>
        </defs>
        <path
          d="M165 132H535"
          className={`wire ${secure ? 'green-wire' : certificate ? 'gold-wire' : ''}`}
          markerEnd={displayed.direction === 'toServer' ? `url(#arrow-${markerId})` : undefined}
          markerStart={displayed.direction === 'toClient' ? `url(#arrow-${markerId})` : undefined}
        />
        {mode === 'mTLS' ? <path d="M165 150H535" className="return-wire" /> : null}
        <path
          d={mode === 'mTLS' ? 'M98 209V237M602 209V237' : 'M98 209V237'}
          className="store-wire"
        />
      </svg>
      <svg
        className="connection-wires mobile-wire"
        viewBox="0 0 300 520"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M72 185V335"
          className={`wire ${secure ? 'green-wire' : certificate ? 'gold-wire' : ''}`}
        />
        <path
          d={displayed.direction === 'toClient' ? 'M66 196L72 186L78 196' : 'M66 324L72 334L78 324'}
          className="wire"
        />
      </svg>
      <div className="server-node dog">
        <button
          className="server-glyph"
          type="button"
          onClick={() => inspect(mode === 'mTLS' ? 'keyStore' : 'trustStore')}
          aria-label="Inspect dog"
        >
          <Server strokeWidth={1.6} />
        </button>
        <strong>dog</strong>
        <span>HTTPS Client</span>
        {catTrusted ? (
          <span className="node-trust">
            <Check size={14} /> cat Trusted
          </span>
        ) : null}
        <ConceptNode
          id="trustStore"
          inspect={inspect}
          label="truststore.p12"
          detail="cat Root CA"
          className={
            ['trust', 'chain', 'serverValidate'].includes(current.phase) ? 'active-node' : ''
          }
        />
      </div>
      <div className="server-node cat">
        <button
          className="server-glyph"
          type="button"
          onClick={() => inspect('serverCert')}
          aria-label="Inspect cat"
        >
          <Server strokeWidth={1.6} />
        </button>
        <strong>cat</strong>
        <span>HTTPS Server</span>
        {dogTrusted ? (
          <span className="node-trust">
            <Check size={14} /> dog Trusted
          </span>
        ) : null}
        {mode === 'mTLS' ? (
          <ConceptNode
            id="catTrustStore"
            inspect={inspect}
            label="cat Trust Store"
            detail="Trusted Client CA"
            className={current.phase === 'clientValidate' ? 'active-node' : ''}
          />
        ) : null}
      </div>
      {secure ? (
        <div className="encrypted-tunnel">
          <span>
            <LockKeyhole size={17} /> HTTPS / {mode}
            {level === 'Advanced' ? ` · TLS ${protocol}` : ''} <LockKeyhole size={17} />
          </span>
          <div className="tunnel-lanes">
            <span>
              API Request <ArrowRight size={14} />
            </span>
            <span>
              <ArrowLeft size={14} /> API Response
            </span>
          </div>
        </div>
      ) : null}
      {transferring ? (
        <motion.div
          key={displayed.id}
          className={`transfer-packet ${certificate ? 'gold' : secure ? 'green' : 'blue'}`}
          style={packetStyle}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            type="button"
            onClick={() => inspect(displayed.concept ?? 'session')}
            aria-label={`Inspect ${displayed.artifact}`}
          >
            <FileBadge size={certificate ? 36 : 23} />
            <strong>{displayed.artifact}</strong>
          </button>
          <small>{displayed.direction === 'toServer' ? 'dog → cat' : 'cat → dog'}</small>
        </motion.div>
      ) : null}
      {failure ? (
        <div className="diagram-failure" role="alert">
          <CircleX size={24} />
          <strong>TLS Handshake Failed</strong>
          <span>{failure.title}</span>
        </div>
      ) : null}
      {state.status === 'idle' ? (
        <div className="diagram-ready">พร้อมเชื่อมต่อ · กด Play หรือ Connect to cat</div>
      ) : null}
    </div>
  )
}
export function StepControls({ controller }: { controller: HandshakeController }) {
  const { state, steps, failure } = controller
  return (
    <>
      <div className="step-rail" aria-label="Handshake progress">
        <ol>
          {steps.map((s, index) => (
            <li
              key={s.id}
              className={`${index < state.index ? 'done' : ''} ${index === state.index ? 'current' : ''}`}
              aria-current={index === state.index ? 'step' : undefined}
            >
              <span>{index < state.index ? <Check size={15} /> : index + 1}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="step-label" aria-live="polite">
        <span>
          {state.index + 1} / {steps.length}
        </span>{' '}
        · {controller.current.title}
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Step elapsed time"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((state.elapsed / STEP_DURATION) * 100)}
      >
        <span style={{ width: `${(state.elapsed / STEP_DURATION) * 100}%` }} />
      </div>
      <div className="playback-controls">
        <Button onClick={controller.previous} disabled={state.index === 0}>
          <ArrowLeft size={19} />
          <span>Previous</span>
        </Button>
        <Button
          className="primary"
          onClick={state.status === 'running' ? controller.pause : controller.play}
        >
          {state.status === 'running' ? <Pause size={19} /> : <Play size={19} />}
          <span>{state.status === 'running' ? 'Pause' : 'Play'}</span>
        </Button>
        <Button
          onClick={controller.next}
          disabled={Boolean(failure) || state.index === steps.length - 1}
        >
          <span>Next</span>
          <ArrowRight size={19} />
        </Button>
        <Button onClick={controller.reset}>
          <RotateCcw size={18} />
          <span>Reset</span>
        </Button>
      </div>
    </>
  )
}
function StepInspector({
  controller,
  level,
  mode,
  inspect,
}: {
  controller: HandshakeController
  level: Level
  mode: Mode
  inspect: Inspect
}) {
  const { current, state } = controller
  const complete = state.status === 'complete'
  return (
    <aside className="panel step-inspector">
      <div className="inspector-label">{complete ? 'CONNECTION COMPLETE' : 'CURRENT STEP'}</div>
      <h2>{complete ? 'API Response Received' : current.title}</h2>
      <p>
        {complete
          ? 'dog และ cat สื่อสารผ่าน encrypted connection สำเร็จแล้ว'
          : current.description}
      </p>
      {current.concept ? (
        <ConceptNode id={current.concept} inspect={inspect} detail="คลิกเพื่อดูคำอธิบาย" />
      ) : (
        <ConceptNode id="serverCert" inspect={inspect} detail="cat identity · Certificate" />
      )}
      {current.phase === 'serverCert' || state.status === 'idle' ? (
        <dl className="preview-fields">
          <div>
            <dt>Subject</dt>
            <dd>cat.example.internal</dd>
          </div>
          <div>
            <dt>Issuer</dt>
            <dd>Company Intermediate CA</dd>
          </div>
        </dl>
      ) : null}
      {level === 'Beginner' ? (
        <Note>
          <strong>นึกภาพง่าย ๆ</strong>
          <p>
            {mode === 'TLS'
              ? 'dog รับบัตรของ cat แล้วตรวจว่าผู้ออกบัตรอยู่ในรายชื่อที่เชื่อถือหรือไม่'
              : 'dog ตรวจบัตรของ cat และ cat ก็ตรวจบัตรของ dog ด้วย'}
          </p>
        </Note>
      ) : (
        <Note>
          <strong>TLS {mode === 'mTLS' ? 'mutual' : 'server'} authentication</strong>
          <p>
            Private Key พิสูจน์ ownership · symmetric traffic keys เข้ารหัส payload · Finished
            ยืนยัน handshake integrity
          </p>
        </Note>
      )}
      <SecurityReminder inspect={inspect} />
      <div className="inspector-status" aria-live="polite">
        {complete ? (
          <>
            <CircleCheck size={20} /> Secure {mode} · API Response Received
          </>
        ) : state.status === 'running' ? (
          <>
            <span className="live-dot" />{' '}
            {current.phase.includes('Validate') ? 'Validating identity…' : 'Handshake in progress…'}
          </>
        ) : state.status === 'paused' ? (
          <>
            <Pause size={17} /> Paused · ดูรายละเอียดขั้นนี้ได้
          </>
        ) : (
          <>กด Play เพื่อเริ่มเรียนรู้</>
        )}
      </div>
    </aside>
  )
}
export function HandshakeChapter({
  controller,
  mode,
  level,
  protocol,
  inspect,
}: {
  controller: HandshakeController
  mode: Mode
  level: Level
  protocol: Protocol
  inspect: Inspect
}) {
  return (
    <>
      <div className="learning-grid">
        <section className="panel handshake-panel">
          <ConnectionDiagram {...{ controller, mode, level, protocol, inspect }} />
          <StepControls controller={controller} />
        </section>
        <StepInspector {...{ controller, level, mode, inspect }} />
      </div>
      <div className="flow-note">
        <span>
          {level === 'Beginner'
            ? 'Conceptual flow · ลำดับย่อเพื่อการเรียนรู้'
            : `Full TLS ${protocol} certificate handshake · ${protocol === '1.2' ? 'ECDHE' : 'ECDHE + HKDF'}`}
        </span>
        <span>ตัวอย่างจำลอง · ไม่มีการเรียก cat จริง</span>
      </div>
      <ApplicationFlow controller={controller} mode={mode} />
      <Summary inspect={inspect} />
    </>
  )
}
function ApplicationFlow({ controller, mode }: { controller: HandshakeController; mode: Mode }) {
  const secure =
    controller.state.index >= controller.steps.findIndex((s) => s.phase === 'secure') &&
    !controller.failure
  return (
    <section className="panel application-section">
      <div>
        <h2>หลัง Secure Connection เกิดอะไรขึ้น?</h2>
        <p>Transport security สร้างช่องทางปลอดภัย จากนั้นจึงเริ่ม API business logic</p>
      </div>
      <div className="layer-flow">
        <div>
          <strong>Application Layer</strong>
          <span>HTTP / REST API</span>
        </div>
        <ArrowRight />
        <div className={secure ? 'layer-active' : ''}>
          <strong>Security Transport Layer</strong>
          <span>
            <LockKeyhole size={15} /> TLS / mTLS
          </span>
        </div>
        <ArrowRight />
        <div>
          <strong>Network</strong>
          <span>TCP</span>
        </div>
      </div>
      <div className={`request-flow ${secure ? 'request-enabled' : ''}`}>
        <span className="blue">dog</span>
        <span>
          <ArrowRight size={16} /> POST /cat/api/... <ArrowLeft size={16} /> HTTPS Response
        </span>
        <span className="purple">cat</span>
      </div>
      <Note tone={secure ? 'green' : 'slate'}>
        {secure ? (
          <>
            <strong>Secure {mode} Connection Established</strong> — request/response ใช้ application
            traffic keys; cat ตรวจสิทธิ์และประมวลผล API ใน Application Layer
          </>
        ) : (
          'API ยังไม่ถูกส่ง · ต้องสร้าง Secure Connection สำเร็จก่อน'
        )}
      </Note>
    </section>
  )
}
function Summary({ inspect }: { inspect: Inspect }) {
  return (
    <section className="summary-section">
      <h2>จำภาพนี้ให้ได้ แล้ว PKI จะเข้าใจง่ายขึ้น</h2>
      <div className="summary-comparison">
        <div>
          <strong>TLS</strong>
          <span className="blue">dog</span>
          <ArrowRight />
          <span className="purple">cat</span>
          <p>dog verifies cat</p>
        </div>
        <div>
          <strong>mTLS</strong>
          <span className="blue">dog</span>
          <span className="mutual-arrows">
            <ArrowRight />
            <ArrowLeft />
          </span>
          <span className="purple">cat</span>
          <p>dog verifies cat + cat verifies dog</p>
        </div>
      </div>
      <div className="mnemonics">
        {(
          [
            ['serverCert', 'Certificate', 'Identity'],
            ['clientPrivate', 'Private Key', 'Proof of ownership'],
            ['root', 'CA', 'Certificate issuer'],
            ['keyStore', 'Key Store', 'Who I am'],
            ['trustStore', 'Trust Store', 'Who I trust'],
          ] as const
        ).map(([id, title, value]) => (
          <button key={id} type="button" onClick={() => inspect(id)}>
            <strong>{title}</strong>
            <span>{value}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
