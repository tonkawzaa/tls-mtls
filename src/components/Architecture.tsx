import { ArrowDown, ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck, Server } from 'lucide-react'
import type { Level, Mode } from '../data/lessons'
import { ConceptNode, Note, type Inspect } from './Ui'
export function ArchitectureChapter({
  mode,
  level,
  inspect,
}: {
  mode: Mode
  level: Level
  inspect: Inspect
}) {
  return (
    <>
      <section className="architecture-canvas">
        <div className="architecture-pki">
          <ConceptNode
            id="root"
            inspect={inspect}
            label="Corporate PKI"
            detail="Certificate Authority (CA)"
          />
        </div>
        <div className="architecture-issuers">
          <div>
            <ConceptNode id="clientCA" inspect={inspect} />
            <span>
              <ArrowDown size={18} /> ออก Client Certificate ให้ dog
            </span>
          </div>
          <div>
            <ConceptNode id="serverCA" inspect={inspect} />
            <span>
              <ArrowDown size={18} /> ออก Server Certificate ให้ cat
            </span>
          </div>
        </div>
        <div className="architecture-systems">
          <div className="system-box dog-box">
            <header>
              <Server />
              <div>
                <h2>dog</h2>
                <span>Spring Boot · HTTPS Client</span>
              </div>
            </header>
            <div className={`identity-group ${mode === 'TLS' ? 'identity-unused' : ''}`}>
              <ConceptNode id="keyStore" inspect={inspect} />
              <div className="store-contents">
                <ConceptNode id="clientCert" inspect={inspect} detail="dog identity" />
                <ConceptNode
                  id="clientPrivate"
                  inspect={inspect}
                  label="dog-private.key"
                  detail="Private Key · อยู่ใน dog"
                />
                <ConceptNode id="clientCA" inspect={inspect} label="client-intermediate-ca.crt" />
              </div>
              {mode === 'TLS' ? (
                <p className="demo-caption">TLS แบบ server-only ไม่ต้องส่ง Client Certificate</p>
              ) : null}
            </div>
            <div className="trust-group">
              <ConceptNode id="trustStore" inspect={inspect} />
              <ConceptNode
                id="root"
                inspect={inspect}
                label="cat Root CA"
                detail="Corporate Root CA · Trust anchor"
              />
            </div>
          </div>
          <div className="architecture-link">
            <div className="architecture-tunnel">
              <div>
                <LockKeyhole size={23} />
                <strong>HTTPS / {mode}</strong>
                <LockKeyhole size={23} />
              </div>
              <span>TLS 1.2 / TLS 1.3</span>
              <p>
                API Request <ArrowRight size={18} />
              </p>
              <p>
                <ArrowLeft size={18} /> API Response
              </p>
            </div>
            <div className="architecture-verifications">
              <Note tone="green" icon={ShieldCheck}>
                <strong>dog Trust Store</strong>
                <p>verifies Server Certificate</p>
              </Note>
              {mode === 'mTLS' ? (
                <Note tone="green" icon={ShieldCheck}>
                  <strong>cat Trust Store</strong>
                  <p>verifies Client Certificate</p>
                </Note>
              ) : null}
            </div>
            <span className="demo-caption">Architecture หลัง handshake สำเร็จ</span>
          </div>
          <div className="system-box cat-box">
            <header>
              <Server />
              <div>
                <h2>cat</h2>
                <span>HTTPS Server</span>
              </div>
            </header>
            <div className="identity-group">
              <ConceptNode id="catKeyStore" inspect={inspect} />
              <div className="store-contents">
                <ConceptNode id="serverCert" inspect={inspect} detail="cat identity" />
                <ConceptNode
                  id="serverPrivate"
                  inspect={inspect}
                  label="cat-private.key"
                  detail="Private Key · อยู่ใน cat"
                />
                <ConceptNode id="serverCA" inspect={inspect} label="server-intermediate-ca.crt" />
              </div>
            </div>
            <div className={`trust-group ${mode === 'TLS' ? 'identity-unused' : ''}`}>
              <ConceptNode id="catTrustStore" inspect={inspect} />
              <ConceptNode
                id="root"
                inspect={inspect}
                label="Trusted dog Root CA"
                detail="Anchor สำหรับ Company Client CA"
              />
              {mode === 'TLS' ? (
                <p className="demo-caption">ใช้ตรวจ Client Certificate เมื่อเปิด mTLS</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <div className="store-comparison">
        <section className="panel">
          <h2>
            KEY STORE <span>— Who I Am</span>
          </h2>
          <p>ตัวตนและ Private Key ของเรา</p>
          <ConceptNode
            id="keyStore"
            inspect={inspect}
            detail="dog-client.crt + private key + client CA chain"
          />
          {level === 'Advanced' ? (
            <code>PrivateKeyEntry → private key + certificate chain</code>
          ) : (
            <p className="demo-caption">เหมือนกระเป๋าที่เก็บบัตรประจำตัวและลายเซ็นลับของเรา</p>
          )}
        </section>
        <section className="panel">
          <h2>
            TRUST STORE <span>— Who I Trust</span>
          </h2>
          <p>CA ที่เราเชื่อถือ</p>
          <ConceptNode
            id="trustStore"
            inspect={inspect}
            detail="Corporate Root CA สำหรับตรวจ cat"
          />
          {level === 'Advanced' ? (
            <code>trustedCertEntry → trusted CA certificate</code>
          ) : (
            <p className="demo-caption">เหมือนรายชื่อหน่วยงานออกบัตรที่เรายอมรับ</p>
          )}
        </section>
      </div>
      <div className="two-columns architecture-notes">
        <Note tone="red">
          <strong>Private Key อยู่ในระบบเจ้าของเสมอ</strong>
          <p>Certificate ส่งได้ · Private Key ไม่ส่ง ไม่แชร์ ไม่ commit</p>
        </Note>
        <Note>
          <strong>mTLS ยืนยันตัวตน · สิทธิ์ API อยู่ใน Application</strong>
          <p>เชื่อถือ CA ไม่ได้แปลว่า client ทุกตัวมีสิทธิ์เรียก API ทุก endpoint</p>
        </Note>
      </div>
      <section className="panel trust-relationship">
        <h2>Trust Relationship</h2>
        <div>
          <ConceptNode id="trustStore" inspect={inspect} />
          <span className="verification-link">
            verifies <ArrowRight />
          </span>
          <ConceptNode id="serverCert" inspect={inspect} />
        </div>
        {mode === 'mTLS' ? (
          <div>
            <ConceptNode id="catTrustStore" inspect={inspect} />
            <span className="verification-link">
              verifies <ArrowRight />
            </span>
            <ConceptNode id="clientCert" inspect={inspect} />
          </div>
        ) : null}
      </section>
    </>
  )
}
