import {
  buildSteps,
  getFailure,
  type Conditions,
  type Step,
} from '../lib/handshake'
import {
  concepts,
  type CertificateId,
  type Chapter,
  type Level,
  type Mode,
  type Protocol,
} from './lessons'
import type { ConfigTab } from './configuration'

export type ChainSide = 'cat → dog' | 'dog → cat'
export type DiagramContext = {
  chapter: Chapter
  mode: Mode
  level: Level
  protocol: Protocol
  certificate: CertificateId
  chainSide: ChainSide
  configTab: ConfigTab
  conditions: Conditions
}
export type DiagramNode = {
  id: string
  title: string
  detail: string
  tag: string
  tone: 'blue' | 'purple' | 'gold' | 'green' | 'red' | 'slate'
  blocked?: boolean
}
export type DiagramSection = {
  id: string
  title: string
  note: string
  nodes: DiagramNode[]
  linked?: boolean
}
export type Diagram = {
  title: string
  summary: string
  sections: DiagramSection[]
  warning?: { title: string; explanation: string; fix: string }
}

function node(
  id: string,
  title: string,
  detail: string,
  tag: string,
  tone: DiagramNode['tone'],
): DiagramNode {
  return { id, title, detail, tag, tone }
}
function handshakeNode(step: Step): DiagramNode {
  const tone =
    step.phase === 'request' ||
    step.phase === 'response' ||
    step.phase === 'secure'
      ? 'green'
      : step.phase === 'serverCert' || step.phase === 'clientCert'
        ? 'gold'
        : step.phase === 'clientProof'
          ? 'red'
          : step.direction === 'toClient'
            ? 'purple'
            : 'blue'
  const tag =
    step.direction === 'toServer'
      ? 'dog → cat'
      : step.direction === 'toClient'
        ? 'cat → dog'
        : 'ประมวลผลในระบบ'
  return node(step.id, step.title, step.description, tag, tone)
}

export function buildDiagram(context: DiagramContext): Diagram {
  const { chapter, mode, level, protocol, certificate, configTab, conditions } =
    context
  if (chapter === 'handshake' || chapter === 'failures') {
    const steps = buildSteps(mode, level, protocol)
    const failure =
      chapter === 'failures' ? getFailure(steps, conditions) : undefined
    const nodes = steps.map((step, index) => ({
      ...handshakeNode(step),
      ...(failure && index === failure.index
        ? {
            title: failure.title,
            detail: failure.explanation,
            tag: 'หยุดที่ขั้นนี้',
            tone: 'red' as const,
          }
        : {}),
      blocked: failure ? index > failure.index : false,
    }))
    return {
      title:
        chapter === 'handshake'
          ? 'Handshake · จาก connection สู่ API'
          : 'Failure Lab · ตรวจเงื่อนไขก่อนส่ง API',
      summary:
        chapter === 'handshake'
          ? 'ลำดับเดียวกับ simulator · ลูกศรแสดงลำดับขั้น ส่วนป้ายบนกล่องระบุทิศทางการส่งหรือการประมวลผล'
          : failure
            ? 'คาดการณ์จากเงื่อนไขที่เลือก แม้ยังไม่ได้กด Start · กล่องเส้นประคือขั้นที่ไปต่อไม่ได้'
            : 'เงื่อนไขที่เลือกผ่านทั้งหมด · API จะส่งได้เมื่อสร้าง secure connection สำเร็จ',
      sections: [
        {
          id: 'handshake-flow',
          title: `${mode} · ${level === 'Advanced' ? `TLS ${protocol}` : 'Conceptual flow'}`,
          note:
            level === 'Beginner'
              ? 'ภาพรวมเชิงแนวคิด; เลือก Advanced เพื่อดูลำดับแยก TLS 1.2 / 1.3'
              : 'Full certificate handshake · ไม่รวม resumption / 0-RTT',
          nodes,
        },
      ],
      warning: failure
        ? {
            title: failure.code,
            explanation: failure.explanation,
            fix: failure.fix,
          }
        : undefined,
    }
  }
  if (chapter === 'certificates') {
    const selectedClient = certificate === 'clientCert'
    const clientChain = mode === 'mTLS' && context.chainSide === 'dog → cat'
    const issuer = selectedClient ? 'clientCA' : 'serverCA'
    const owner = selectedClient ? 'dog' : 'cat'
    const peer = clientChain ? 'cat' : 'dog'
    const leaf = clientChain ? 'clientCert' : 'serverCert'
    const chainIssuer = clientChain ? 'clientCA' : 'serverCA'
    return {
      title: 'Certificates & CA · ตัวตนและสายโซ่ความเชื่อถือ',
      summary: `Certificate Explorer: ${concepts[certificate].title} · Chain validation: ${clientChain ? 'dog → cat' : 'cat → dog'} (เลือกแยกกันได้)`,
      sections: [
        {
          id: 'certificate-identity',
          title: `Certificate ที่เลือก · ${owner}`,
          note:
            selectedClient && mode === 'TLS'
              ? 'สำรวจ Client Certificate ได้ แต่ TLS แบบ server-only ไม่ตรวจ client identity'
              : 'Public Key อยู่ใน certificate; Private Key อยู่กับเจ้าของ',
          linked: false,
          nodes: [
            node(
              'selected-certificate',
              concepts[certificate].title,
              `Identity + Public Key + Issuer + Signature · EKU ${selectedClient ? 'clientAuth' : 'serverAuth'}`,
              'Certificate Explorer',
              'gold',
            ),
            node(
              'selected-issuer',
              concepts[issuer].title,
              'CA ผู้ออกใบรับรอง; ต้องตรวจลายมือชื่อและ chain ไม่ใช่เทียบชื่ออย่างเดียว',
              'ออกใบรับรอง',
              'gold',
            ),
            node(
              'owner-private-key',
              `${owner} Private Key`,
              'ใช้ลงลายมือชื่อพิสูจน์ ownership; ส่งได้เฉพาะ certificate และลายมือชื่อ',
              `เก็บใน ${owner} เท่านั้น`,
              'red',
            ),
          ],
        },
        {
          id: 'certificate-chain',
          title: `Chain validation · ${clientChain ? 'dog → cat' : 'cat → dog'}`,
          note: 'ลูกศรแสดงขั้นตอนตรวจ chain; local Root CA ไม่ใช่ข้อมูลที่ต้องรับจาก peer',
          nodes: [
            node(
              'leaf',
              concepts[leaf].title,
              'Peer ส่ง leaf certificate พร้อม intermediate chain',
              'จาก peer',
              'gold',
            ),
            node(
              'intermediate',
              concepts[chainIssuer].title,
              'ตรวจ issuer signature และข้อจำกัดของ CA',
              'Intermediate CA',
              'gold',
            ),
            node(
              'local-root',
              `${peer} Trust Store`,
              'ใช้ Corporate Root CA ที่เชื่อถืออยู่แล้วในระบบเป็น local trust anchor',
              'Root CA · local anchor',
              'green',
            ),
            node(
              'validation',
              'ตรวจความเหมาะสมของใบรับรอง',
              `ตรวจ validity, signature, chain และ ${clientChain ? 'EKU clientAuth' : 'EKU serverAuth + hostname/SAN'}`,
              'ตรวจที่ผู้รับ',
              'blue',
            ),
            node(
              'trusted',
              clientChain
                ? 'dog Identity Verified'
                : 'Server Certificate Trusted',
              'ผ่านการตรวจ certificate; proof of ownership และ handshake ยังต้องครบก่อนส่ง API',
              'Certificate ผ่าน',
              'green',
            ),
          ],
        },
      ],
    }
  }
  if (chapter === 'architecture') {
    return {
      title: 'Stores & Architecture · Who I am / Who I trust',
      summary: `ตัวตนและ trust อยู่ในแต่ละระบบ · ${mode === 'mTLS' ? 'ตรวจตัวตนทั้งสองฝั่ง' : 'dog ตรวจตัวตน cat'}`,
      sections: [
        {
          id: 'dog-stores',
          title: 'dog · local material',
          note: 'สองกล่องเป็นข้อมูลใน dog ไม่ใช่ packet ที่ส่งข้ามระบบ',
          linked: false,
          nodes: [
            node(
              'dog-identity',
              'dog Key Store',
              `Client certificate + Private Key + chain · ${mode === 'mTLS' ? 'ใช้ตอบคำขอ client identity' : 'ไม่ใช้ client identity ใน TLS'}`,
              'Private Key อยู่ใน dog',
              'blue',
            ),
            node(
              'dog-trust',
              'dog Trust Store',
              'เก็บ trusted Root CA สำหรับตรวจ chain ของ cat',
              'Local trust anchor',
              'green',
            ),
          ],
        },
        {
          id: 'cat-stores',
          title: 'cat · local material',
          note: 'Private Keys ไม่เดินทางข้ามระบบ',
          linked: false,
          nodes: [
            node(
              'cat-identity',
              'cat Key Store',
              'Server certificate + Private Key + intermediate chain สำหรับพิสูจน์ตัวตน cat',
              'Private Key อยู่ใน cat',
              'purple',
            ),
            node(
              'cat-trust',
              'cat Trust Store',
              `Trusted Root CA สำหรับ client chain · ${mode === 'mTLS' ? 'ใช้ตรวจ dog' : 'ไม่ตรวจ Client Certificate ใน TLS'}`,
              'Local client trust anchor',
              'green',
            ),
          ],
        },
        {
          id: 'architecture-flow',
          title: 'การตรวจตัวตนและรับส่งข้อมูล',
          note: 'ลูกศรแสดงการทำงาน; ส่ง certificate/chain และ proof ไม่ส่ง Private Key',
          nodes: [
            node(
              'server-identity',
              'dog ตรวจ cat',
              'ตรวจ server chain กับ dog Trust Store และตรวจ hostname/SAN',
              'Server authentication',
              'blue',
            ),
            ...(mode === 'mTLS'
              ? [
                  node(
                    'client-identity',
                    'cat ตรวจ dog',
                    'ตรวจ client chain กับ cat Trust Store และตรวจ proof of ownership',
                    'Client authentication',
                    'purple',
                  ),
                ]
              : []),
            node(
              'traffic',
              'Secure tunnel → API',
              'Handshake ต้องสำเร็จ; API request/response ใช้ symmetric traffic keys',
              'Encrypted application data',
              'green',
            ),
          ],
        },
      ],
    }
  }
  const java: Record<ConfigTab, DiagramSection[]> = {
    'SSL Bundle': [
      {
        id: 'bundle-stores',
        title: 'Material ที่โหลดใน dog',
        note: 'อ่าน stores เพื่อเตรียม identity และ trust ในระบบ',
        linked: false,
        nodes: [
          node(
            'bundle-key',
            'dog-keystore.p12',
            `dog identity + Private Key + chain · ${mode === 'TLS' ? 'ไม่ต้องใช้ client identity ใน TLS' : 'ใช้เมื่อ cat ขอ Client Certificate'}`,
            'Key Store · local',
            'blue',
          ),
          node(
            'bundle-trust',
            'dog-truststore.p12',
            'Trusted Root CA สำหรับตรวจ Server certificate chain',
            'Trust Store · local',
            'green',
          ),
        ],
      },
      {
        id: 'bundle-flow',
        title: 'จาก configuration สู่การใช้งาน',
        note: 'ประกาศ bundle อย่างเดียว ยังไม่ผูกกับ HTTP Client',
        nodes: [
          node(
            'bundle',
            'SSL Bundle: cat',
            'spring.ssl.bundle.jks.cat รวม material จาก Key Store และ Trust Store',
            'application.yml',
            'gold',
          ),
          node(
            'managers',
            'KeyManager / TrustManager',
            'เตรียม identity selection และ peer certificate validation สำหรับ SSLContext',
            'SSL material',
            'blue',
          ),
          node(
            'attachment',
            'ผูกกับ HTTP Client',
            'RestClient ต้องนำ bundle ไปใช้ด้วย ssl.fromBundle("cat") ก่อนเรียก cat',
            'ดูแท็บ HTTP Client',
            'purple',
          ),
        ],
      },
    ],
    'HTTP Client': [
      {
        id: 'http-client-flow',
        title: 'HTTPS ขาออก · dog → cat',
        note: 'RestClient ใช้ bundle ที่กำหนดไว้จริง',
        nodes: [
          node(
            'http-bundle',
            'SSL Bundle: cat',
            'โหลด identity และ trusted CA จาก bundle ชื่อ cat',
            'SSL material',
            'gold',
          ),
          node(
            'http-apply',
            'ssl.fromBundle("cat")',
            'RestClient.Builder.apply(...) ผูก SSL configuration เข้ากับ client',
            'RestClientSsl',
            'blue',
          ),
          node(
            'http-client',
            'RestClient → cat',
            `เชื่อมต่อ https://cat.example.internal ด้วย ${mode}; API ส่งหลัง handshake สำเร็จ`,
            'Outbound HTTPS',
            'green',
          ),
        ],
      },
    ],
    'JVM Options': [
      {
        id: 'jvm-flow',
        title: 'JVM properties → default JSSE context',
        note: 'มีผลกับ clients ที่ใช้ default SSLContext; custom SSLContext ต้องตั้งค่าแยก',
        nodes: [
          node(
            'jvm-properties',
            'javax.net.ssl.*',
            'กำหนด keyStore / trustStore, type และ password placeholders ผ่าน JVM options',
            'ตั้งค่าก่อนสร้าง context',
            'gold',
          ),
          node(
            'default-context',
            'Default JSSE SSLContext',
            'ใช้ properties เพื่อเตรียม KeyManager และ TrustManager ของ default context',
            'ภายใน JVM',
            'blue',
          ),
          node(
            'default-client',
            'dog ที่ใช้ default context',
            `ใช้ context นี้ทำ ${mode} handshake ไป cat; client ที่สร้าง context เองไม่รับการตั้งค่านี้โดยอัตโนมัติ`,
            'Outbound HTTPS',
            'green',
          ),
        ],
      },
    ],
    'Inbound HTTPS': [
      {
        id: 'inbound-material',
        title: 'Server identity สำหรับ HTTPS ขาเข้าของ dog',
        note: 'ใช้ Server Certificate แยกจาก Client Certificate สำหรับเรียก cat',
        linked: false,
        nodes: [
          node(
            'inbound-store',
            'Key Store สำหรับ HTTPS ขาเข้า',
            'dog-server-keystore.p12 เก็บ serverAuth certificate + Private Key + chain',
            'Private Key อยู่ใน dog',
            'blue',
          ),
        ],
      },
      {
        id: 'inbound-flow',
        title: 'HTTPS ขาเข้า · ผู้เรียก → dog',
        note: 'ตัวอย่างตั้ง HTTPS ขาเข้า; ไม่เปิด inbound mTLS และไม่ตั้ง outbound client',
        nodes: [
          node(
            'incoming-client',
            'ผู้เรียก HTTPS',
            'ผู้เรียกตรวจ Server Certificate ของ dog กับ trust ที่ผู้เรียกกำหนด',
            'Caller → dog',
            'purple',
          ),
          node(
            'dog-server',
            'HTTPS ขาเข้าของแอปฝั่ง dog :8443',
            'แอปฝั่ง dog รับบท HTTPS Server ขาเข้า; server.ssl ตั้ง listener และ server identity',
            'Inbound HTTPS',
            'blue',
          ),
          node(
            'inbound-api',
            'dog API',
            'รับ API ผ่าน secure connection ขาเข้า; การเรียก cat ขาออกต้องตั้ง HTTP Client แยก',
            'Encrypted request/response',
            'green',
          ),
        ],
      },
    ],
  }
  return {
    title: `Java Configuration · ${configTab}`,
    summary:
      'Java 21 · Spring Boot 3.5 · แยก server identity, client identity และ trust ให้ชัดเจน',
    sections: java[configTab],
  }
}
