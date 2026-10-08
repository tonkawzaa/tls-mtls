import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  FileBadge,
  Info,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  certificateFields,
  certificates,
  fieldDescriptions,
  type CertificateField,
  type CertificateId,
  type Level,
  type Mode,
} from '../data/lessons'
import {
  Button,
  ConceptNode,
  Note,
  SecurityReminder,
  Segment,
  type Inspect,
} from './Ui'
import type { ChainSide } from '../data/diagrams'
export function CertificatesChapter({
  mode,
  level,
  inspect,
  openFailures,
  certificate,
  setCertificate,
  chainSide,
  setChainSide,
  chainPauseVersion,
}: {
  mode: Mode
  level: Level
  inspect: Inspect
  openFailures: () => void
  certificate: CertificateId
  setCertificate: (certificate: CertificateId) => void
  chainSide: ChainSide
  setChainSide: (side: ChainSide) => void
  chainPauseVersion: number
}) {
  const [field, setField] = useState<CertificateField>('SAN')
  return (
    <>
      <div className="certificate-grid">
        <section className="panel pki-panel">
          <h2>CA Hierarchy</h2>
          <p>ใครออกใบรับรองให้ใคร และความเชื่อถือเริ่มตรงไหน</p>
          <div className="pki-tree">
            <div className="root-node">
              <ConceptNode id="root" inspect={inspect} detail="Trust Anchor" />
            </div>
            <div className="issuer-branches">
              <div>
                <ConceptNode
                  id="clientCA"
                  inspect={inspect}
                  detail="Client certificate issuer"
                />
                <span className="signs-label">
                  <ArrowDown size={18} /> signs
                </span>
                <ConceptNode
                  id="clientCert"
                  inspect={inspect}
                  detail="Client Authentication"
                />
              </div>
              <div>
                <ConceptNode
                  id="serverCA"
                  inspect={inspect}
                  detail="Server certificate issuer"
                />
                <span className="signs-label">
                  <ArrowDown size={18} /> signs
                </span>
                <ConceptNode
                  id="serverCert"
                  inspect={inspect}
                  detail="Server Authentication"
                />
              </div>
            </div>
          </div>
          <ChainValidation
            key={mode}
            {...{ mode, level, inspect, openFailures, chainPauseVersion }}
            side={chainSide}
            setSide={setChainSide}
          />
        </section>
        <aside className="panel certificate-inspector">
          <h2>Certificate Explorer</h2>
          <p>คลิก field เพื่อดูว่ามีหน้าที่อะไร</p>
          <Segment
            label="Certificate selection"
            options={['serverCert', 'clientCert']}
            value={certificate}
            onChange={setCertificate}
            labels={{
              serverCert: 'cat-server.crt',
              clientCert: 'dog-client.crt',
            }}
          />
          <div className="certificate-tab-label">
            <FileBadge size={17} />
            {certificate === 'serverCert'
              ? 'cat-server.crt'
              : 'dog-client.crt'}
          </div>
          <div className="certificate-fields">
            {certificateFields.map((name) => (
              <button
                key={name}
                type="button"
                className={field === name ? 'field-selected' : ''}
                aria-pressed={field === name}
                onClick={() => setField(name)}
              >
                <span>{name}</span>
                <strong>{certificates[certificate][name]}</strong>
              </button>
            ))}
          </div>
          <Note icon={Info}>
            <strong>
              {field === 'SAN' ? 'Subject Alternative Name (SAN)' : field}
            </strong>
            <p>{fieldDescriptions[field]}</p>
          </Note>
          <span className="demo-caption">
            ข้อมูลสมมติ · Demo date: 07 Oct 2026
          </span>
        </aside>
      </div>
      <section className="panel certificate-key-comparison">
        <h2>Certificate ≠ Private Key</h2>
        <div className="two-columns">
          <div>
            <ConceptNode
              id="clientCert"
              inspect={inspect}
              detail="Identity · Public Key · Issuer · Signature"
            />
            <p>Certificate เป็นบัตรประจำตัว สามารถส่งให้ระบบอื่นตรวจสอบได้</p>
          </div>
          <div>
            <ConceptNode
              id="clientPrivate"
              inspect={inspect}
              detail="Private Key อยู่ใน dog เท่านั้น"
            />
            <p>
              Private Key ใช้พิสูจน์ ownership ส่งเฉพาะลายมือชื่อให้ cat ตรวจ
            </p>
          </div>
        </div>
        <SecurityReminder inspect={inspect} />
      </section>
    </>
  )
}
function ChainValidation({
  mode,
  level,
  inspect,
  openFailures,
  side,
  setSide,
  chainPauseVersion,
}: {
  mode: Mode
  level: Level
  inspect: Inspect
  openFailures: () => void
  side: ChainSide
  setSide: (side: ChainSide) => void
  chainPauseVersion: number
}) {
  const [stage, setStage] = useState(-1)
  const [playVersion, setPlayVersion] = useState<number | null>(null)
  const playing = playVersion === chainPauseVersion
  function setPlaying(value: boolean) {
    setPlayVersion(value ? chainPauseVersion : null)
  }
  const reduced = useReducedMotion()
  const client = mode === 'mTLS' && side === 'dog → cat'
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (stage >= 4) setPlayVersion(null)
      else setStage((s) => s + 1)
    }, 900)
    return () => clearTimeout(timer)
  }, [playing, stage])
  const nodes = client
    ? (['clientCert', 'clientCA', 'root', 'catTrustStore'] as const)
    : (['serverCert', 'serverCA', 'root', 'trustStore'] as const)
  return (
    <div className="chain-validation">
      <div className="section-row">
        <h3>Certificate Chain Verification</h3>
        {mode === 'mTLS' ? (
          <Segment
            label="Chain direction"
            options={['cat → dog', 'dog → cat']}
            value={side}
            onChange={(value) => {
              setSide(value)
              setStage(-1)
              setPlaying(false)
            }}
          />
        ) : null}
      </div>
      <div className="chain-path">
        {nodes.map((id, i) => (
          <div
            className={`chain-entry ${stage >= i ? 'chain-checked' : ''}`}
            key={id}
          >
            <ConceptNode
              id={id}
              inspect={inspect}
              label={
                i === 2
                  ? 'Root CA'
                  : i === 3
                    ? client
                      ? 'cat Trust Store'
                      : 'dog Trust Store'
                    : undefined
              }
              detail={
                i === 2
                  ? 'จาก Trust Store'
                  : i === 1
                    ? 'ส่งพร้อม leaf'
                    : undefined
              }
            />
            {i < nodes.length - 1 ? (
              <ArrowRight size={17} className="chain-arrow" />
            ) : null}
          </div>
        ))}
      </div>
      <div className="chain-actions">
        <Button
          className="primary"
          onClick={() => {
            if (stage >= 4) setStage(-1)
            setPlaying(true)
          }}
          disabled={playing}
        >
          <Play size={16} /> Play validation
        </Button>
        <Button
          className="icon-button"
          aria-label="Reset chain validation"
          onClick={() => {
            setPlaying(false)
            setStage(-1)
          }}
        >
          <RotateCcw size={16} />
        </Button>
        <Button className="text-button" onClick={openFailures}>
          Simulate errors <ArrowRight size={15} />
        </Button>
      </div>
      {stage >= 4 ? (
        <motion.div
          className="chain-result"
          initial={reduced ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          <ShieldCheck size={19} />
          {client
            ? 'dog Identity Verified'
            : 'Server Certificate Trusted'}{' '}
          <Check size={17} />
        </motion.div>
      ) : (
        <p className="chain-explanation">
          {client
            ? 'dog ส่ง Client Certificate + Client CA chain · cat มี trusted root ใน Trust Store'
            : 'cat ส่ง leaf + Intermediate CA · dog มี Root CA ใน Trust Store'}
        </p>
      )}
      {level === 'Advanced' ? (
        <p className="demo-caption">
          Signature verification → CA constraints → local trust anchor ·
          พร้อมตรวจ validity และ EKU · Root ที่ peer ส่งมาไม่สร้าง trust
          โดยอัตโนมัติ
        </p>
      ) : null}
    </div>
  )
}
