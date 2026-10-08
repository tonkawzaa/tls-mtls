export type Mode = 'TLS' | 'mTLS'
export type Level = 'Beginner' | 'Advanced'
export type Protocol = '1.2' | '1.3'
export type Chapter = 'handshake' | 'certificates' | 'architecture' | 'java' | 'failures'
export type ConceptId =
  | 'serverCert'
  | 'clientCert'
  | 'clientPrivate'
  | 'serverPrivate'
  | 'publicKey'
  | 'root'
  | 'serverCA'
  | 'clientCA'
  | 'keyStore'
  | 'trustStore'
  | 'catTrustStore'
  | 'catKeyStore'
  | 'session'
export const chapters: { id: Chapter; title: string; heading: string; subtitle: string }[] = [
  {
    id: 'handshake',
    title: 'Handshake',
    heading: 'TLS / mTLS Handshake',
    subtitle: 'ดูการเชื่อมต่อ dog กับ cat ทีละขั้นตอน',
  },
  {
    id: 'certificates',
    title: 'Certificates & CA',
    heading: 'Certificates & CA',
    subtitle: 'สำรวจตัวตน ผู้ออกใบรับรอง และสายโซ่ความเชื่อถือ',
  },
  {
    id: 'architecture',
    title: 'Stores & Architecture',
    heading: 'Stores & Architecture',
    subtitle: 'ตัวตนของเรา และระบบที่เราเชื่อถือ',
  },
  {
    id: 'java',
    title: 'Java Configuration',
    heading: 'Spring Boot / Java',
    subtitle: 'ตั้งค่า HTTPS client ของ dog เพื่อเรียก cat',
  },
  {
    id: 'failures',
    title: 'Failure Lab',
    heading: 'Failure Simulator',
    subtitle: 'ทดลองเงื่อนไข แล้วดูว่า Handshake หยุดที่ไหน',
  },
]
export const concepts: Record<
  ConceptId,
  { title: string; analogy: string; text: string; advanced: string; color: string }
> = {
  serverCert: {
    title: 'cat-server.crt',
    analogy: 'บัตรประจำตัวของ cat',
    text: 'dog ตรวจบัตรของ cat ว่าออกโดย CA ที่เชื่อถือได้ ยังไม่หมดอายุ และ SAN ตรงกับ hostname ที่กำลังเรียก',
    advanced:
      'X.509 end-entity certificate · EKU serverAuth · CertificateVerify พิสูจน์ว่า cat ครอบครอง private key ที่ตรงกับ public key ใน certificate',
    color: 'gold',
  },
  clientCert: {
    title: 'dog-client.crt',
    analogy: 'บัตรประจำตัวของ dog',
    text: 'dog ส่ง Certificate นี้ให้ cat ใน mTLS เพื่อแสดงตัวตน และใช้ Private Key พิสูจน์ว่าเป็นเจ้าของ Certificate',
    advanced:
      'X.509 client certificate · Subject CN=dog · EKU clientAuth · cat ตรวจ chain และ proof of possession ก่อนยอมรับ identity',
    color: 'gold',
  },
  clientPrivate: {
    title: 'dog Private Key',
    analogy: 'ลายเซ็นลับของเจ้าของบัตร',
    text: 'อยู่กับ dog เท่านั้น ไม่ส่งไป cat ไม่แชร์ และไม่ commit ลง Git ใช้สร้างลายมือชื่อเพื่อพิสูจน์ ownership',
    advanced:
      'CertificateVerify signs the handshake transcript. cat ตรวจลายมือชื่อด้วย public key ของ dog; private key ไม่ใช่ session key และไม่ได้เข้ารหัส API payload โดยตรง',
    color: 'red',
  },
  serverPrivate: {
    title: 'cat Private Key',
    analogy: 'ลายเซ็นลับของ cat',
    text: 'เก็บใน cat เท่านั้น ใช้พิสูจน์ว่า cat เป็นเจ้าของ Server Certificate โดยไม่ส่ง Private Key ให้ dog',
    advanced:
      'TLS 1.3 ใช้ CertificateVerify; TLS 1.2 ECDHE ใช้ signed ServerKeyExchange. Secret key material ไม่ออกจากระบบเจ้าของ',
    color: 'red',
  },
  publicKey: {
    title: 'Public Key',
    analogy: 'เครื่องมือตรวจลายเซ็น',
    text: 'อยู่ใน Certificate และแชร์ได้ ใช้ตรวจลายมือชื่อที่สร้างจาก Private Key คู่กัน แต่ใช้คำนวณ Private Key กลับไม่ได้',
    advanced:
      'Peer public key ตรวจ proof of possession; issuer public key ตรวจ certificate signature. API payload ใช้ symmetric traffic keys',
    color: 'gold',
  },
  root: {
    title: 'Corporate Root CA',
    analogy: 'หน่วยงานที่เราเลือกเชื่อถือ',
    text: 'เป็นจุดเริ่มความเชื่อถือที่ติดตั้งไว้ใน Trust Store ไม่ได้เชื่อเพียงเพราะ cat ส่งมา หรือเพราะชื่อ Issuer ตรงกัน',
    advanced:
      'Trust Anchor เป็น local trust decision. การตรวจ chain ต้องตรวจ cryptographic signatures, CA constraints และ validity; CA private key ไม่ถูกส่งในการเชื่อมต่อ',
    color: 'green',
  },
  serverCA: {
    title: 'Company Intermediate CA',
    analogy: 'หน่วยงานที่ออกบัตรให้ cat',
    text: 'ออก Certificate ให้ cat และได้รับการรับรองจาก Corporate Root CA cat ส่งใบรับรอง intermediate มาพร้อม Server Certificate',
    advanced:
      'Issuing CA · Basic Constraints CA=true · keyCertSign. Intermediate ช่วยแยกงาน issuing ออกจาก Root CA และสร้าง path ไปยัง trust anchor',
    color: 'green',
  },
  clientCA: {
    title: 'Company Client CA',
    analogy: 'หน่วยงานที่ออกบัตรให้ dog',
    text: 'ออก Client Certificate ให้ dog และได้รับการรับรองจาก Corporate Root CA cat ต้องมี trust anchor ที่ยอมรับ chain นี้',
    advanced:
      'Client issuing CA · cat ตรวจ clientAuth EKU, chain, validity และ CertificateVerify. ชื่อ CA เพียงอย่างเดียวไม่ใช่หลักฐานความน่าเชื่อถือ',
    color: 'green',
  },
  keyStore: {
    title: 'dog-keystore.p12',
    analogy: 'กระเป๋าตัวตนและกุญแจของเรา',
    text: 'Who I Am — เก็บ Client Certificate, Private Key และ certificate chain ใช้เมื่อ cat ขอ Client Certificate ใน mTLS',
    advanced:
      'PKCS12 PrivateKeyEntry ผูก private key กับ leaf certificate และ chain ผ่าน alias; ไม่ใช่แค่ถุงรวมไฟล์ .crt/.key · KeyManager เลือก identity ที่ใช้',
    color: 'gold',
  },
  trustStore: {
    title: 'dog-truststore.p12',
    analogy: 'รายชื่อหน่วยงานที่เราเชื่อถือ',
    text: 'Who I Trust — เก็บ Corporate Root CA สำหรับตรวจ Certificate chain ของ cat ไม่ต้องเก็บ Private Key ของ cat',
    advanced:
      'PKCS12 trustedCertEntry · TrustManager ตรวจ peer chain กับ trust anchors. Material ถูกโหลดเข้ากับ SSLContext; ภาพเปิด store เป็นการอธิบายเชิงแนวคิด',
    color: 'green',
  },
  catTrustStore: {
    title: 'cat Trust Store',
    analogy: 'รายชื่อหน่วยงานที่ cat เชื่อถือ',
    text: 'เก็บ trusted root สำหรับ Client CA ของ dog เพื่อให้ cat ตรวจ identity ของ dog ใน mTLS',
    advanced:
      'ตัวอย่างใช้ Corporate Root CA เป็น anchor สำหรับ Company Client CA. การ trust CA ยืนยัน identity แต่สิทธิ์ API ต้องมี authorization policy แยกต่างหาก',
    color: 'green',
  },
  catKeyStore: {
    title: 'cat Key Store',
    analogy: 'กระเป๋าตัวตนของ cat',
    text: 'เก็บ Server Certificate, cat Private Key และ intermediate chain สำหรับยืนยัน cat กับ dog',
    advanced:
      'cat identity อาจเก็บเป็น PKCS12, PEM หรือ hardware-backed key ขึ้นกับ TLS server. สิ่งสำคัญคือ private key ตรงกับ leaf certificate',
    color: 'gold',
  },
  session: {
    title: 'TLS Session Keys',
    analogy: 'กุญแจชั่วคราวสำหรับการสนทนา',
    text: 'ทั้งสองฝั่งสร้างกุญแจสำหรับเข้ารหัสข้อมูลใน session นี้ หลังยืนยันตัวตนและ handshake สำเร็จ API request/response จึงวิ่งผ่าน secure tunnel',
    advanced:
      'ECDHE key agreement + key derivation → symmetric traffic keys. TLS 1.3 แยก handshake traffic keys กับ application traffic keys; ไม่ได้ส่ง session key เป็น plaintext',
    color: 'green',
  },
}
export type CertificateId = 'serverCert' | 'clientCert'
export const certificateFields = [
  'Subject',
  'SAN',
  'Issuer',
  'Serial Number',
  'Valid From',
  'Valid To',
  'Public Key',
  'Signature Algorithm',
  'Extended Key Usage',
] as const
export type CertificateField = (typeof certificateFields)[number]
export const certificates: Record<CertificateId, Record<CertificateField, string>> = {
  serverCert: {
    Subject: 'CN = cat.example.internal',
    SAN: 'DNS: cat.example.internal',
    Issuer: 'Company Intermediate CA',
    'Serial Number': '01:A0:26:10:01',
    'Valid From': '01 Oct 2026',
    'Valid To': '01 Oct 2027',
    'Public Key': 'RSA 2048 · ตัวอย่าง',
    'Signature Algorithm': 'SHA256withRSA',
    'Extended Key Usage': 'Server Authentication (serverAuth)',
  },
  clientCert: {
    Subject: 'CN = dog',
    SAN: 'URI: urn:company:dog',
    Issuer: 'Company Client CA',
    'Serial Number': '01:A0:26:10:02',
    'Valid From': '01 Oct 2026',
    'Valid To': '01 Oct 2027',
    'Public Key': 'RSA 2048 · ตัวอย่าง',
    'Signature Algorithm': 'SHA256withRSA',
    'Extended Key Usage': 'Client Authentication (clientAuth)',
  },
}
export const fieldDescriptions: Record<CertificateField, string> = {
  Subject:
    'ตัวตนที่ใบรับรองระบุไว้ เช่น CN=dog หรือ cat แต่การตรวจ hostname ของ HTTPS ต้องตรวจ SAN ไม่ใช่อาศัย CN เพียงอย่างเดียว',
  SAN: 'Subject Alternative Name: dog ต้องตรวจว่า hostname cat.example.internal อยู่ใน DNS SAN ของ cat ส่วน Client Certificate ใช้ระบุตัวตนตาม policy ไม่ตรวจ hostname แบบ server',
  Issuer:
    'CA ที่ลงลายมือชื่อออก Certificate นี้ ต้องตรวจลายมือชื่อและ chain ต่อไปถึง trust anchor ไม่ใช่เทียบชื่อ CA แล้วเชื่อทันที',
  'Serial Number':
    'หมายเลขที่ issuer กำหนดให้ certificate ใช้ระบุใบรับรองร่วมกับ Issuer และใช้ในการตรวจสถานะการเพิกถอน',
  'Valid From':
    'Not Before: ใบรับรองเริ่มใช้ได้เมื่อใด ระบบต้องมีเวลาที่ถูกต้อง ตัวอย่างนี้ใช้เวลา demo 07 Oct 2026',
  'Valid To': 'Not After: วันหมดอายุ หากอยู่นอกช่วงอายุการใช้งาน validation จะไม่ผ่าน',
  'Public Key':
    'กุญแจสาธารณะของเจ้าของใบรับรอง ใช้ตรวจ proof of possession ที่สร้างด้วย Private Key ไม่ใช่กุญแจลับสำหรับเข้ารหัส API payload',
  'Signature Algorithm':
    'อัลกอริทึมที่ issuer ใช้ลงลายมือชื่อ Certificate ไม่ใช่ TLS cipher suite และไม่ใช่ session encryption algorithm',
  'Extended Key Usage':
    'กำหนดวัตถุประสงค์: serverAuth สำหรับ cat และ clientAuth สำหรับ dog แม้ chain เชื่อถือได้ ก็ต้องใช้ certificate ให้ตรงงาน',
}
