import { useState } from 'react'
import { ArrowRight, FileCode2, KeyRound, Server } from 'lucide-react'
import {
  configuration,
  getCodeLines,
  type ConfigTab,
} from '../data/configuration'
import type { Level, Mode } from '../data/lessons'
import { ConceptNode, CopyButton, Note, Segment, type Inspect } from './Ui'
export function JavaChapter({
  mode,
  level,
  inspect,
  tab,
  setTab,
}: {
  mode: Mode
  level: Level
  inspect: Inspect
  tab: ConfigTab
  setTab: (tab: ConfigTab) => void
}) {
  const [selected, setSelected] = useState<'key' | 'trust'>('key')
  const snippet = configuration[tab]
  const inbound = tab === 'Inbound HTTPS'
  const lines = getCodeLines(snippet.code, tab)
  return (
    <>
      <div className="panel configuration-tabs">
        <Segment
          label="Configuration tabs"
          options={[
            'SSL Bundle',
            'HTTP Client',
            'JVM Options',
            'Inbound HTTPS',
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div className="configuration-grid">
        <section className="code-editor" aria-label={snippet.file}>
          <header>
            <span>
              <FileCode2 size={18} />
              {snippet.file}
            </span>
            <CopyButton key={tab} text={snippet.code} />
          </header>
          <div className="code-scroll">
            <pre>
              <code>
                {lines.map(({ text, number, group: lineGroup }) =>
                  lineGroup ? (
                    <button
                      key={number}
                      type="button"
                      className={`code-line ${selected === lineGroup ? `highlight-${lineGroup}` : ''}`}
                      onClick={() => setSelected(lineGroup)}
                      aria-label={`Highlight ${lineGroup === 'key' ? 'Key Store' : 'Trust Store'} line ${number}`}
                    >
                      <span className="line-number">{number}</span>
                      <span>{text || ' '}</span>
                    </button>
                  ) : (
                    <span className="code-line" key={number}>
                      <span className="line-number">{number}</span>
                      <span>{text || ' '}</span>
                    </span>
                  ),
                )}
              </code>
            </pre>
          </div>
          <footer>Java 21 · Spring Boot 3.5 · RestClient</footer>
        </section>
        <aside className="configuration-inspector">
          {inbound ? (
            <section className="panel">
              <h2>
                <Server size={24} /> Inbound HTTPS
              </h2>
              <p>
                OneApp เป็น HTTPS Server สำหรับผู้ที่เรียกเข้ามา ต้องมี Server
                Certificate และ Private Key ของ OneApp
              </p>
              <Note>
                ใช้ <code>oneapp-server-keystore.p12</code> ที่มี serverAuth
                certificate แยกจาก Client Certificate สำหรับเรียก ECAS
              </Note>
              <p>
                ตัวอย่างนี้ตั้ง HTTPS ขาเข้าเท่านั้น ไม่ได้เปิด mTLS
                ขาเข้าหรือกำหนด trust สำหรับ outbound
              </p>
            </section>
          ) : (
            <>
              <section
                className={`panel config-store ${selected === 'key' ? 'selected-store' : ''}`}
              >
                <h2>Key Store · Who I Am</h2>
                <p>oneapp-keystore.p12</p>
                <ConceptNode id="clientCert" inspect={inspect} />
                <ConceptNode id="clientPrivate" inspect={inspect} />
                <ConceptNode
                  id="clientCA"
                  inspect={inspect}
                  label="Intermediate CA chain"
                />
                <div className="client-to-ecas">
                  <span className="blue">OneApp HTTP Client</span>
                  <ArrowRight size={20} />
                  <span className="purple">ECAS</span>
                </div>
                <Note icon={KeyRound}>
                  OneApp ใช้ Key Store เมื่อ ECAS ขอ Client Certificate ·
                  Private Key ใช้ลงลายมือชื่อและไม่ถูกส่ง
                  {mode === 'TLS' ? (
                    <p>ใน TLS แบบ server-only ไม่ต้องใช้ Client Key Store</p>
                  ) : null}
                </Note>
              </section>
              <section
                className={`panel config-store ${selected === 'trust' ? 'selected-store' : ''}`}
              >
                <h2>Trust Store · Who I Trust</h2>
                <ConceptNode id="trustStore" inspect={inspect} />
                <ConceptNode
                  id="root"
                  inspect={inspect}
                  label="ECAS Root CA"
                  detail="Corporate Root CA · local trust anchor"
                />
                <Note tone="green">
                  OneApp ใช้ Trust Store ตรวจ Certificate chain ของ ECAS
                </Note>
              </section>
            </>
          )}
          <Note>
            <strong>server.ssl = HTTPS ขาเข้า</strong>
            <p>การเรียก ECAS ขาออก ต้องผูก SSL Bundle กับ HTTP Client</p>
          </Note>
          {tab === 'HTTP Client' ? (
            <Note tone="green">
              <code>ssl.fromBundle("ecas")</code>
              <p>
                เชื่อม configuration ใน SSL Bundle กับ RestClient จริง
                ไม่ใช่เพียงประกาศ path ใน YAML
              </p>
            </Note>
          ) : null}
          {tab === 'JVM Options' ? (
            <Note>
              <strong>Default JSSE context</strong>
              <p>
                มีผลกับ clients ที่ใช้ default SSLContext เท่านั้น client
                ที่สร้าง SSLContext เองต้องตั้งค่าแยก; ***** เป็น placeholder
                ไม่ใช่รหัสผ่านจริง
              </p>
            </Note>
          ) : null}
          {level === 'Advanced' ? (
            <Note tone="slate">
              KeyManager เลือก identity · TrustManager ตรวจ peer chain ·
              SSLContext ผูก material กับ TLS engine; custom{' '}
              <code>application.ecas.*</code> ต้องมีโค้ดอ่านและนำไปใช้
            </Note>
          ) : null}
        </aside>
      </div>
      <p className="source-links">
        อ้างอิง:{' '}
        <a
          href="https://docs.spring.io/spring-boot/3.5/reference/features/ssl.html"
          target="_blank"
          rel="noreferrer"
        >
          Spring Boot SSL Bundles
        </a>{' '}
        ·{' '}
        <a
          href="https://docs.spring.io/spring-boot/3.5/reference/io/rest-client.html"
          target="_blank"
          rel="noreferrer"
        >
          RestClient SSL
        </a>{' '}
        ·{' '}
        <a
          href="https://docs.oracle.com/en/java/javase/21/security/java-secure-socket-extension-jsse-reference-guide.html"
          target="_blank"
          rel="noreferrer"
        >
          Java 21 JSSE
        </a>
      </p>
    </>
  )
}
