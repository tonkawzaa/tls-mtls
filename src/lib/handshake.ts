import type { Mode, Level, Protocol, ConceptId } from '../data/lessons'
export type Phase =
  | 'connect'
  | 'hello'
  | 'serverHello'
  | 'serverCert'
  | 'serverValidate'
  | 'trust'
  | 'chain'
  | 'requestCert'
  | 'keyStore'
  | 'clientCert'
  | 'clientProof'
  | 'clientValidate'
  | 'keys'
  | 'finished'
  | 'secure'
  | 'request'
  | 'response'
export type Step = {
  id: string
  title: string
  description: string
  phase: Phase
  direction?: 'toServer' | 'toClient'
  artifact?: string
  concept?: ConceptId
}
const step = (
  id: string,
  title: string,
  description: string,
  phase: Phase,
  direction?: Step['direction'],
  artifact?: string,
  concept?: ConceptId,
): Step => ({ id, title, description, phase, direction, artifact, concept })
const common = {
  connect: step(
    'connect',
    'OneApp opens connection',
    'OneApp เตรียมเปิด HTTPS connection ไปยัง ecas.example.internal',
    'connect',
  ),
  hello: step(
    'hello',
    'ClientHello',
    'OneApp เสนอ TLS version, cipher suites และข้อมูลสำหรับ key agreement ให้ ECAS',
    'hello',
    'toServer',
    'ClientHello',
  ),
  serverHello: step(
    'server-hello',
    'ServerHello',
    'ECAS เลือก TLS version และ cryptographic parameters ที่ทั้งสองฝั่งรองรับ',
    'serverHello',
    'toClient',
    'ServerHello',
  ),
  certificate: step(
    'server-certificate',
    'ECAS sends Server Certificate',
    'ECAS ส่งบัตรประจำตัวพร้อม Intermediate CA ให้ OneApp โดย Private Key อยู่ใน ECAS',
    'serverCert',
    'toClient',
    'ecas-server.crt',
    'serverCert',
  ),
  validate: step(
    'validate-server',
    'OneApp validates ECAS Certificate',
    'ตรวจลายมือชื่อ ช่วงอายุ SAN และ Server Authentication EKU เพื่อยืนยัน ECAS ตัวจริง',
    'serverValidate',
    undefined,
    undefined,
    'serverCert',
  ),
  trust: step(
    'trust-store',
    'OneApp reads Trust Store',
    'ดูรายชื่อ CA ที่ OneApp เชื่อถือ ใน oneapp-truststore.p12',
    'trust',
    undefined,
    undefined,
    'trustStore',
  ),
  chain: step(
    'chain',
    'Validate Certificate Chain',
    'ตรวจ leaf → Intermediate CA → Root CA ที่อยู่ใน Trust Store จนยืนยัน ECAS ได้',
    'chain',
    undefined,
    undefined,
    'root',
  ),
  requestCert: step(
    'request-client-certificate',
    'ECAS requests Client Certificate',
    'mTLS: ECAS ขอให้ OneApp แสดงบัตรประจำตัวด้วย',
    'requestCert',
    'toClient',
    'CertificateRequest',
  ),
  keyStore: step(
    'key-store',
    'OneApp reads Key Store',
    'เลือก Client Certificate และ Private Key คู่กัน จาก oneapp-keystore.p12',
    'keyStore',
    undefined,
    undefined,
    'keyStore',
  ),
  clientCert: step(
    'client-certificate',
    'OneApp sends Client Certificate',
    'ส่ง oneapp-client.crt และ Client CA chain ให้ ECAS โดยไม่ส่ง Private Key',
    'clientCert',
    'toServer',
    'oneapp-client.crt',
    'clientCert',
  ),
  clientProof: step(
    'client-proof',
    'OneApp proves certificate ownership',
    'OneApp ใช้ Private Key ลงลายมือชื่อ แล้วส่งเฉพาะลายมือชื่อให้ ECAS ตรวจด้วย Public Key',
    'clientProof',
    'toServer',
    'CertificateVerify · signature',
    'clientPrivate',
  ),
  clientValidate: step(
    'validate-client',
    'ECAS validates OneApp Certificate',
    'ECAS ตรวจ Client Certificate chain, validity, clientAuth EKU และ proof of ownership',
    'clientValidate',
    undefined,
    undefined,
    'ecasTrustStore',
  ),
  keys: step(
    'session-keys',
    'TLS session keys are established',
    'ทั้งสองฝั่ง derive symmetric keys สำหรับ session นี้ ไม่ส่ง Private Key หรือ session key เป็น plaintext',
    'keys',
    undefined,
    undefined,
    'session',
  ),
  secure: step(
    'secure',
    'Secure Connection Established',
    'ยืนยัน handshake สำเร็จ เปิด encrypted tunnel แล้วจึงส่ง API data',
    'secure',
    undefined,
    undefined,
    'session',
  ),
  request: step(
    'request',
    'OneApp sends ECAS API Request',
    'ส่ง POST /ecas/api/... ภายใน TLS tunnel นี่คือ Application Layer ที่เริ่มหลัง secure connection',
    'request',
    'toServer',
    'POST /ecas/api/...',
  ),
  response: step(
    'response',
    'ECAS sends API Response',
    'ECAS ประมวลผล business logic และส่ง HTTPS response กลับภายใน encrypted tunnel',
    'response',
    'toClient',
    '200 OK · API Response',
  ),
}
export function buildSteps(mode: Mode, level: Level, protocol: Protocol): Step[] {
  if (level === 'Beginner')
    return mode === 'TLS'
      ? [
          common.connect,
          common.hello,
          common.serverHello,
          common.certificate,
          common.validate,
          common.trust,
          common.chain,
          common.keys,
          common.secure,
          common.request,
        ]
      : [
          common.connect,
          common.hello,
          common.serverHello,
          common.certificate,
          common.trust,
          common.validate,
          common.requestCert,
          common.keyStore,
          common.clientCert,
          common.clientProof,
          common.clientValidate,
          {
            ...common.secure,
            description:
              'ECDHE key agreement, key derivation และ Finished ยืนยันความสมบูรณ์ของ handshake ก่อนเปิด mTLS tunnel',
          },
          common.request,
          common.response,
        ]
  const validate = {
    ...common.validate,
    description:
      'TrustManager ตรวจ peer chain กับ loaded trust anchors, validity, signature และ EKU; HTTPS client ตรวจ DNS SAN กับ ecas.example.internal',
  }
  if (protocol === '1.3')
    return [
      common.connect,
      { ...common.hello, artifact: 'ClientHello + key_share' },
      { ...common.serverHello, artifact: 'ServerHello + key_share' },
      step(
        'handshake-keys',
        'Derive handshake traffic keys',
        'ECDHE + HKDF สร้าง handshake keys; messages หลัง ServerHello ถูกเข้ารหัสแล้ว แต่ยังไม่เปิด application tunnel',
        'keys',
        undefined,
        undefined,
        'session',
      ),
      step(
        'encrypted-extensions',
        'EncryptedExtensions',
        'ECAS ส่ง negotiated extensions ผ่าน handshake encryption',
        'serverHello',
        'toClient',
        'EncryptedExtensions',
      ),
      ...(mode === 'mTLS' ? [common.requestCert] : []),
      common.certificate,
      validate,
      step(
        'server-proof',
        'Server CertificateVerify',
        'ECAS ลงลายมือชื่อ handshake transcript เพื่อพิสูจน์ ownership; OneApp ตรวจด้วย ECAS public key',
        'serverValidate',
        'toClient',
        'CertificateVerify · signature',
        'serverPrivate',
      ),
      step(
        'server-finished',
        'Server Finished',
        'OneApp ตรวจ Finished MAC เพื่อยืนยัน server handshake integrity',
        'finished',
        'toClient',
        'Finished',
      ),
      ...(mode === 'mTLS'
        ? [
            common.keyStore,
            common.clientCert,
            { ...common.clientProof, title: 'Client CertificateVerify' },
            common.clientValidate,
          ]
        : []),
      step(
        'client-finished',
        'Client Finished',
        'ECAS ตรวจ Finished MAC; derive application traffic keys พร้อมใช้ หลัง authentication สำเร็จ',
        'finished',
        'toServer',
        'Finished',
      ),
      common.secure,
      common.request,
      common.response,
    ]
  return [
    common.connect,
    common.hello,
    common.serverHello,
    common.certificate,
    validate,
    step(
      'server-key-exchange',
      'ServerKeyExchange · ECDHE',
      'ECAS ส่ง ephemeral ECDHE parameters พร้อมลายมือชื่อจาก ECAS Private Key',
      'serverValidate',
      'toClient',
      'Signed ServerKeyExchange',
      'serverPrivate',
    ),
    ...(mode === 'mTLS' ? [common.requestCert] : []),
    step(
      'server-hello-done',
      'ServerHelloDone',
      'ECAS ส่ง server handshake messages ครบแล้ว',
      'serverHello',
      'toClient',
      'ServerHelloDone',
    ),
    ...(mode === 'mTLS' ? [common.keyStore, common.clientCert] : []),
    step(
      'client-key-exchange',
      'ClientKeyExchange · ECDHE',
      'OneApp ส่ง ephemeral public key; ทั้งสองฝั่งคำนวณ shared secret และ derive keys',
      'keys',
      'toServer',
      'ClientKeyExchange',
      'session',
    ),
    ...(mode === 'mTLS'
      ? [{ ...common.clientProof, title: 'Client CertificateVerify' }, common.clientValidate]
      : []),
    step(
      'client-ccs',
      'Client ChangeCipherSpec',
      'OneApp เปลี่ยนไปใช้ negotiated keys สำหรับ TLS records ที่ส่งต่อจากนี้',
      'keys',
      'toServer',
      'ChangeCipherSpec',
    ),
    step(
      'client-finished',
      'Client Finished',
      'ส่ง Finished MAC ที่เข้ารหัส; ECAS ตรวจ handshake integrity',
      'finished',
      'toServer',
      'Finished',
    ),
    step(
      'server-ccs',
      'Server ChangeCipherSpec',
      'ECAS เปลี่ยนไปใช้ negotiated keys สำหรับ TLS records',
      'keys',
      'toClient',
      'ChangeCipherSpec',
    ),
    step(
      'server-finished',
      'Server Finished',
      'OneApp ตรวจ Finished MAC; handshake สำเร็จทั้งสองฝั่ง',
      'finished',
      'toClient',
      'Finished',
    ),
    common.secure,
    common.request,
    common.response,
  ]
}
export type Conditions = {
  serverValid: boolean
  serverTrusted: boolean
  notExpired: boolean
  hostname: boolean
  chainComplete: boolean
  notRevoked: boolean
  clientAvailable: boolean
  privateAvailable: boolean
  keyMatches: boolean
  clientValid: boolean
  clientTrusted: boolean
}
export const validConditions: Conditions = {
  serverValid: true,
  serverTrusted: true,
  notExpired: true,
  hostname: true,
  chainComplete: true,
  notRevoked: true,
  clientAvailable: true,
  privateAvailable: true,
  keyMatches: true,
  clientValid: true,
  clientTrusted: true,
}
export const conditionLabels: Record<keyof Conditions, string> = {
  serverValid: 'ECAS Certificate valid',
  serverTrusted: 'ECAS CA trusted by OneApp',
  notExpired: 'Certificate not expired',
  hostname: 'Hostname matches SAN',
  chainComplete: 'Complete Certificate Chain',
  notRevoked: 'Certificate not revoked',
  clientAvailable: 'OneApp Client Certificate',
  privateAvailable: 'OneApp Private Key',
  keyMatches: 'Certificate / Key match',
  clientValid: 'OneApp Certificate valid',
  clientTrusted: 'OneApp CA trusted by ECAS',
}
export const presets: { id: string; label: string; field?: keyof Conditions; client?: boolean }[] =
  [
    { id: 'valid', label: 'Valid' },
    { id: 'untrusted', label: 'Untrusted CA', field: 'serverTrusted' },
    { id: 'expired', label: 'Expired', field: 'notExpired' },
    { id: 'hostname', label: 'Wrong Hostname', field: 'hostname' },
    { id: 'chain', label: 'Incomplete Chain', field: 'chainComplete' },
    { id: 'revoked', label: 'Revoked', field: 'notRevoked' },
    { id: 'missing-cert', label: 'Missing Client Cert', field: 'clientAvailable', client: true },
    { id: 'missing-key', label: 'Missing Key', field: 'privateAvailable', client: true },
    { id: 'key-mismatch', label: 'Key Mismatch', field: 'keyMatches', client: true },
    { id: 'client-untrusted', label: 'Untrusted Client CA', field: 'clientTrusted', client: true },
    { id: 'server-invalid', label: 'Invalid Server Cert', field: 'serverValid' },
    { id: 'client-invalid', label: 'Invalid Client Cert', field: 'clientValid', client: true },
  ]
export function presetConditions(id: string): Conditions {
  const field = presets.find((p) => p.id === id)?.field
  return field ? { ...validConditions, [field]: false } : { ...validConditions }
}
export type Failure = {
  field: keyof Conditions
  title: string
  code: string
  explanation: string
  fix: string
  phase: Phase
  index: number
}
const failures: Omit<Failure, 'index'>[] = [
  {
    field: 'serverValid',
    phase: 'serverValidate',
    title: 'Invalid ECAS Certificate',
    code: 'bad_certificate / invalid signature or EKU',
    explanation:
      'Certificate ของ ECAS ไม่ผ่านการตรวจลายมือชื่อ หรือไม่เหมาะสำหรับ Server Authentication',
    fix: 'ตรวจ certificate signature, issuer chain และ serverAuth EKU',
  },
  {
    field: 'serverTrusted',
    phase: 'serverValidate',
    title: 'Unknown / Untrusted CA',
    code: 'PKIX path building failed',
    explanation: 'OneApp ไม่พบ CA ที่เชื่อถือได้สำหรับ Certificate ของ ECAS',
    fix: 'ตรวจ Corporate Root CA ใน oneapp-truststore.p12 และ chain ที่ ECAS ส่งมา',
  },
  {
    field: 'notExpired',
    phase: 'serverValidate',
    title: 'Certificate Expired',
    code: 'CertificateExpiredException',
    explanation: 'Certificate ของ ECAS อยู่นอกช่วง Valid From / Valid To',
    fix: 'ต่ออายุ certificate และตรวจเวลาเครื่องทั้งสองระบบ',
  },
  {
    field: 'hostname',
    phase: 'serverValidate',
    title: 'Hostname Verification Failed',
    code: 'No subject alternative DNS name matching ecas.example.internal',
    explanation: 'Hostname ที่ OneApp เรียก ไม่ตรงกับ DNS SAN ของ ECAS Certificate',
    fix: 'ใช้ endpoint ที่ตรงกับ SAN หรือออก certificate ที่มี DNS SAN ที่ถูกต้อง',
  },
  {
    field: 'chainComplete',
    phase: 'serverValidate',
    title: 'Incomplete Certificate Chain',
    code: 'unable to find valid certification path',
    explanation: 'ECAS ไม่ส่ง Intermediate CA ที่จำเป็น จึงสร้าง path ไปยัง trusted root ไม่ได้',
    fix: 'ตั้ง ECAS ให้ส่ง leaf + intermediate chain; demo นี้ไม่มี cached intermediate หรือ AIA fetching',
  },
  {
    field: 'notRevoked',
    phase: 'serverValidate',
    title: 'Certificate Revoked',
    code: 'CertificateRevokedException',
    explanation: 'CA เพิกถอน Certificate นี้แล้ว แม้วันหมดอายุยังไม่ถึง',
    fix: 'ออก certificate ใหม่ และตรวจสถานะกับ CA; simulation นี้สมมติว่าเปิด OCSP/CRL validation',
  },
  {
    field: 'clientAvailable',
    phase: 'keyStore',
    title: 'Client Certificate Required',
    code: 'certificate_required / no suitable client certificate',
    explanation: 'ECAS ต้องการ Client Certificate แต่ OneApp ไม่มี identity ให้ส่ง',
    fix: 'ติดตั้ง client certificate และ chain ใน PrivateKeyEntry ของ OneApp Key Store',
  },
  {
    field: 'privateAvailable',
    phase: 'keyStore',
    title: 'Cannot prove certificate ownership',
    code: 'No client private key available',
    explanation: 'มี Certificate อย่างเดียว แต่ไม่มี Private Key สำหรับพิสูจน์ ownership',
    fix: 'ตรวจ private key entry และ alias ใน OneApp Key Store ห้ามส่ง key ไป ECAS',
  },
  {
    field: 'keyMatches',
    phase: 'clientProof',
    title: 'TLS Authentication Failed',
    code: 'CertificateVerify signature verification failed',
    explanation:
      'Private Key ไม่ตรงกับ Public Key ใน OneApp Certificate จึงพิสูจน์ ownership ไม่ได้',
    fix: 'ใช้ certificate และ private key คู่กัน; Java KeyStore/provider อาจตรวจพบก่อนส่ง handshake',
  },
  {
    field: 'clientValid',
    phase: 'clientValidate',
    title: 'Client Certificate Verification Failed',
    code: 'bad_certificate / invalid clientAuth certificate',
    explanation:
      'ECAS ตรวจ OneApp Certificate ไม่ผ่าน เช่น หมดอายุ ลายมือชื่อผิด หรือ EKU ไม่ใช่ clientAuth',
    fix: 'ตรวจ client certificate validity, signature, EKU และ chain',
  },
  {
    field: 'clientTrusted',
    phase: 'clientValidate',
    title: 'Client Certificate Verification Failed',
    code: 'unknown_ca / untrusted client issuer',
    explanation: 'ECAS ไม่เชื่อ CA ที่ออก Certificate ให้ OneApp',
    fix: 'ตรวจ approved client trust anchor ใน ECAS Trust Store และ Client CA chain ที่ OneApp ส่งมา',
  },
]
export function getFailure(steps: Step[], conditions: Conditions): Failure | undefined {
  return failures
    .filter((f) => !conditions[f.field])
    .map((f) => ({ ...f, index: steps.findIndex((s) => s.phase === f.phase) }))
    .filter((f) => f.index >= 0)
    .sort((a, b) => a.index - b.index)[0]
}
export const STEP_DURATION = 2500
export type Playback = {
  index: number
  elapsed: number
  status: 'idle' | 'running' | 'paused' | 'complete' | 'failed'
}
export const initialPlayback: Playback = { index: 0, elapsed: 0, status: 'idle' }
export function movePlayback(target: number, steps: Step[], failure?: Failure): Playback {
  const index = Math.max(0, Math.min(target, steps.length - 1, failure?.index ?? Infinity))
  return {
    index,
    elapsed: STEP_DURATION / 2,
    status: failure && index === failure.index ? 'failed' : 'paused',
  }
}
export function tickPlayback(
  state: Playback,
  delta: number,
  steps: Step[],
  failure?: Failure,
): Playback {
  if (state.status !== 'running') return state
  if (failure && state.index >= failure.index) return { ...state, status: 'failed' }
  const elapsed = state.elapsed + delta
  if (elapsed < STEP_DURATION) return { ...state, elapsed }
  if (state.index === steps.length - 1)
    return { ...state, elapsed: STEP_DURATION, status: 'complete' }
  const index = state.index + 1
  return { index, elapsed: 0, status: failure && index === failure.index ? 'failed' : 'running' }
}
