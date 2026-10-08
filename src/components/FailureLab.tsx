import {
  ArrowRight,
  CircleX,
  FlaskConical,
  Play,
  RotateCcw,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import type { Level, Mode, Protocol } from '../data/lessons'
import { conditionLabels, presets, type Conditions } from '../lib/handshake'
import type { HandshakeController } from '../hooks/useHandshake'
import { ConnectionDiagram, StepControls } from './Handshake'
import { Button, Note, type Inspect } from './Ui'
export function FailureLab({
  mode,
  level,
  protocol,
  inspect,
  controller,
  conditions,
  preset,
  choosePreset,
  update,
  reset,
}: {
  mode: Mode
  level: Level
  protocol: Protocol
  inspect: Inspect
  controller: HandshakeController
  conditions: Conditions
  preset: string
  choosePreset: (id: string) => void
  update: (key: keyof Conditions, value: boolean) => void
  reset: () => void
}) {
  const failure = controller.failure
  const running = controller.state.status === 'running'
  const complete = controller.state.status === 'complete'
  const serverFields: (keyof Conditions)[] = [
    'serverValid',
    'serverTrusted',
    'notExpired',
    'hostname',
    'chainComplete',
    'notRevoked',
  ]
  const clientFields: (keyof Conditions)[] = [
    'clientAvailable',
    'privateAvailable',
    'keyMatches',
    'clientValid',
    'clientTrusted',
  ]
  function toggle(key: keyof Conditions, client = false) {
    return (
      <label
        className={`condition-switch ${!conditions[key] ? 'condition-false' : ''} ${client && mode === 'TLS' ? 'condition-disabled' : ''}`}
        key={key}
      >
        <span>
          <ShieldCheck size={17} />
          {conditionLabels[key]}
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-label={conditionLabels[key]}
          checked={conditions[key]}
          disabled={client && mode === 'TLS'}
          onChange={(e) => update(key, e.target.checked)}
        />
        <span className="switch-track" aria-hidden="true" />
      </label>
    )
  }
  return (
    <>
      <div className="failure-grid">
        <div>
          <section className="panel">
            <ConnectionDiagram {...{ controller, mode, level, protocol, inspect }} />
            <StepControls controller={controller} />
          </section>
          <div
            className={`failure-result ${failure ? 'result-error' : complete ? 'result-success' : ''}`}
            aria-live="polite"
          >
            {failure ? (
              <>
                <div className="result-heading">
                  <CircleX />
                  <div>
                    <h2>{failure.title}</h2>
                    <code>{failure.code}</code>
                  </div>
                </div>
                <p>{failure.explanation}</p>
                <div className="failure-fix">
                  <Wrench size={19} />
                  <div>
                    <strong>แนวทางตรวจสอบ</strong>
                    <p>{failure.fix}</p>
                  </div>
                </div>
                <small>
                  ข้อความ Java/TLS เป็นตัวอย่าง · ลำดับการตรวจและ error อาจต่างตาม provider
                </small>
              </>
            ) : complete ? (
              <>
                <div className="result-heading">
                  <ShieldCheck />
                  <h2>Secure {mode} Connection Established</h2>
                </div>
                <p>
                  cat Trusted ✓ {mode === 'mTLS' ? '· dog Trusted ✓' : ''} · API Request Sent ·
                  API Response Received
                </p>
              </>
            ) : (
              <>
                <div className="result-heading">
                  <FlaskConical />
                  <h2>
                    {running ? 'Handshake in progress…' : 'ทดลองได้ โดยไม่ต้องมี Certificate จริง'}
                  </h2>
                </div>
                <p>
                  {running
                    ? controller.current.description
                    : 'เลือกสถานการณ์หรือปรับเงื่อนไข แล้วกด Start Handshake เพื่อดูว่าการตรวจสอบหยุดที่ขั้นไหน'}
                </p>
              </>
            )}
          </div>
        </div>
        <aside className="panel conditions-panel">
          <h2>Handshake Conditions</h2>
          <h3>Server Certificate</h3>
          {serverFields.map((key) => toggle(key))}
          <div className="conditions-divider" />
          <h3>mTLS dog Checks</h3>
          {mode === 'TLS' ? (
            <p className="demo-caption">ข้ามการตรวจ client identity ใน TLS</p>
          ) : null}
          {clientFields.map((key) => toggle(key, true))}
          <div className="conditions-actions">
            <Button className="primary" onClick={controller.start}>
              <Play size={18} /> Start Handshake
            </Button>
            <Button className="icon-button" aria-label="Reset failure conditions" onClick={reset}>
              <RotateCcw size={18} />
            </Button>
          </div>
        </aside>
      </div>
      <section className="panel presets-panel">
        <h3>เลือกสถานการณ์จำลอง</h3>
        <div className="preset-list">
          {presets.map((item) => (
            <Button
              key={item.id}
              className={preset === item.id ? 'preset-selected' : ''}
              aria-pressed={preset === item.id}
              onClick={() => choosePreset(item.id)}
            >
              {item.label}
              {item.client && mode === 'TLS' ? (
                <span className="preset-mode">
                  mTLS <ArrowRight size={12} />
                </span>
              ) : null}
            </Button>
          ))}
        </div>
        <Note tone={complete ? 'green' : failure ? 'red' : 'slate'}>
          {complete
            ? 'API request/response ส่งผ่าน encrypted tunnel แล้ว'
            : 'API ยังไม่ถูกส่ง · Secure Connection ต้องสร้างสำเร็จก่อน'}
        </Note>
        <p className="demo-caption">
          Revoked: สมมติว่าเปิด OCSP/CRL checking · Incomplete Chain: ไม่มี cached intermediate หรือ
          AIA fetching · หลาย error จะหยุดที่ blocker แรกของ simulator
        </p>
      </section>
    </>
  )
}
