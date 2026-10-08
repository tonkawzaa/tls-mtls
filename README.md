# OneApp ↔ ECAS · TLS / mTLS Learning

เว็บเรียนรู้ภาษาไทยแบบ frontend-only สำหรับ Developer, Infrastructure, Security, Solution Architect และ QA ใช้ React + TypeScript + Vite, Tailwind CSS, Framer Motion, Lucide และ SVG

## Run

ต้องมี Node.js 22.12+ หรือ 24 และ npm

```sh
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง โดยค่าเริ่มต้นคือ http://127.0.0.1:5173

```sh
npm run build
npm run preview
npm run lint
npm test
```

## Demo guide

1. เริ่มใน Handshake: TLS + Beginner กด Connect to ECAS หรือ Play แล้วใช้ Pause, Previous, Next, Reset เพื่อดูรายละเอียด
2. เปลี่ยนเป็น mTLS เพื่อเห็น Certificate สองทาง และ proof of ownership โดยไม่มี Private Key เดินทางออกจากเจ้าของ
3. Advanced แยก TLS 1.2 แบบ ECDHE กับ TLS 1.3 ตาม full certificate handshake; Beginner ใช้ conceptual flow 10/14 ขั้น
4. Certificates & CA: คลิก field, CA หรือ Certificate และ Play validation ทั้ง server/client chain
5. Stores & Architecture: คลิก stores เพื่อสำรวจ identity และ trust; TLS ข้าม Client Certificate authentication
6. Java Configuration: ดู SSL Bundle / HTTP Client / JVM Options / Inbound HTTPS คลิกบรรทัด store เพื่อ highlight และ Copy ตัวอย่าง
7. Failure Lab: เลือก preset หรือเปลี่ยนเงื่อนไข กด Start Handshake แล้วดู blocker, ตัวอย่าง error และวิธีตรวจสอบ เลือก client preset จะเปลี่ยนเป็น mTLS อัตโนมัติ

ทุกบทมีปุ่ม **ดูแผนภาพการทำงาน** เปิด SVG popup ตาม TLS/mTLS, ระดับบทเรียน และเวอร์ชันที่เลือก ใน Certificates รูปแยก Certificate Explorer จากทิศทาง chain validation ส่วน Java มี diagram แยกทั้ง 4 แท็บ Failure Lab คาดการณ์ blocker จากเงื่อนไขปัจจุบันได้ก่อนกด Start เปิด **อ่านคำอธิบายทีละขั้น** เพื่ออ่านรายละเอียดเต็ม ปิดด้วยปุ่ม X, Escape หรือคลิกพื้นหลัง

เปิด diagram แล้ว playback จะหยุดโดยเก็บขั้นเดิม ปิด popup แล้วกด Play เพื่อเล่นต่อ; Play validation เล่น chain ต่อจากขั้นที่ค้าง และ Reset เริ่มใหม่ หน้าจอมือถือจัด SVG เป็นแนวตั้ง รองรับ light/dark theme และคืน focus ไปยังปุ่มเปิดเมื่อปิด popup

การเปลี่ยน protocol/authentication/learning level จะ reset handshake; การเปลี่ยนบท pause และเก็บขั้นเดิม; เปิด inspector จะ pause; theme เก็บใน localStorage เท่านั้น ปรับ reduced motion ตามระบบได้

## Structure

- `src/data`: lesson content, certificate fixtures และ Java configuration examples
- `src/lib/handshake.ts`: protocol sequences, conditions, deterministic failures และ pure playback transitions
- `src/hooks/useHandshake.ts`: clock lifecycle, pause/resume/reset และ cleanup
- `src/components`: learning chapters, SVG diagram, controls และ accessible native dialog
- `tests`: protocol ordering, failure matrix, clock lifecycle และ workspace interactions

ผลตรวจและภาพหน้าจอจริง: [QA report](docs/QA.md)

## Educational boundaries

ทุก Certificate, key และ hostname เป็นข้อมูลสมมติ ใช้เวลา demo 07 October 2026 ไม่มี PEM/key material จริง ไม่มี backend, real TLS handshake หรือการเรียก ECAS HTTP API จริง Font และ UI assets อยู่ใน bundle ไม่ต้องโหลดจาก CDN

- Certificate มี identity และ public key ส่วน Private Key ใช้ลงลายมือชื่อพิสูจน์ ownership; API payload ใช้ symmetric traffic keys
- Peer ส่ง leaf + intermediate chain; trust anchor มาจาก local Trust Store ชื่อ CA ตรงกันอย่างเดียวไม่สร้าง trust
- Corporate Root CA มี Company Intermediate CA สำหรับ ECAS และ Company Client CA สำหรับ OneApp ตัวอย่าง ECAS trust root สำหรับ client chain แต่ API authorization เป็น application policy แยก
- PKCS12 identity ใช้ PrivateKeyEntry ที่มี key กับ certificate chain; trust anchor ใช้ trustedCertEntry
- "อ่าน store" เป็นภาพอธิบาย KeyManager/TrustManager ที่ใช้ material ใน SSLContext ไม่ใช่การเปิดไฟล์ทุก connection
- Java examples ใช้ Java 21 / Spring Boot 3.5: SSL Bundle ต้องผูกกับ RestClient จริง; server.ssl ตั้ง HTTPS ขาเข้า ไม่ตั้ง outbound client
- JVM options มีผลกับ clients ที่ใช้ default JSSE SSLContext; passwords เป็น placeholders อย่าแทนด้วย secrets ที่จะ commit
- Revocation simulation สมมติว่าเปิด OCSP/CRL checking แล้ว; Java ไม่ได้เปิด revocation checking ในทุก default setup
- Incomplete Chain สมมติว่าไม่มี cached intermediate หรือ AIA fetching
- หากเงื่อนไขผิดหลายข้อ simulator หยุดที่ blocker แรกตามลำดับที่กำหนด ไม่ใช่คำรับรองว่า JSSE/provider ทุกตัวตรวจเรียงแบบนี้
- ไม่รวม session resumption, PSK, 0-RTT, renegotiation, load balancer TLS termination หรือ certificate provisioning

## Sources

- [TLS 1.3 · RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html)
- [TLS 1.2 · RFC 5246](https://www.rfc-editor.org/rfc/rfc5246.html)
- [X.509 / PKI · RFC 5280](https://www.rfc-editor.org/info/rfc5280/)
- [Spring Boot 3.5 SSL Bundles](https://docs.spring.io/spring-boot/3.5/reference/features/ssl.html)
- [Spring Boot 3.5 REST clients](https://docs.spring.io/spring-boot/3.5/reference/io/rest-client.html)
- [Java 21 JSSE](https://docs.oracle.com/en/java/javase/21/security/java-secure-socket-extension-jsse-reference-guide.html)
