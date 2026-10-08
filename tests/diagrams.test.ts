import { describe, expect, it } from 'vitest'
import { buildDiagram, type DiagramContext } from '../src/data/diagrams'
import { presetConditions, validConditions } from '../src/lib/handshake'

const base: DiagramContext = {
  chapter: 'handshake',
  mode: 'TLS',
  level: 'Beginner',
  protocol: '1.3',
  certificate: 'serverCert',
  chainSide: 'ECAS → OneApp',
  configTab: 'SSL Bundle',
  conditions: validConditions,
}
const nodes = (context: DiagramContext) =>
  buildDiagram(context).sections.flatMap((section) => section.nodes)
describe('diagram content', () => {
  it('distinguishes conceptual TLS and mTLS flows', () => {
    expect(nodes(base)).toHaveLength(10)
    expect(nodes({ ...base, mode: 'mTLS' })).toHaveLength(14)
    expect(
      nodes(base).some((node) => node.title.includes('Client Certificate')),
    ).toBe(false)
    expect(
      nodes({ ...base, mode: 'mTLS' }).some((node) =>
        node.title.includes('Client Certificate'),
      ),
    ).toBe(true)
  })
  it('shows separate Advanced TLS 1.2 and 1.3 sequences', () => {
    const tls12 = nodes({ ...base, level: 'Advanced', protocol: '1.2' }).map(
      (node) => node.id,
    )
    const tls13 = nodes({ ...base, level: 'Advanced', protocol: '1.3' }).map(
      (node) => node.id,
    )
    expect(tls12).toContain('server-key-exchange')
    expect(tls12).toContain('client-ccs')
    expect(tls13).toContain('handshake-keys')
    expect(tls13).not.toContain('client-ccs')
  })
  it.each([
    'untrusted',
    'expired',
    'hostname',
    'chain',
    'revoked',
    'missing-key',
    'missing-cert',
    'key-mismatch',
    'client-untrusted',
    'server-invalid',
    'client-invalid',
  ])('predicts %s and blocks later API steps before playback', (preset) => {
    const diagram = buildDiagram({
      ...base,
      chapter: 'failures',
      mode: 'mTLS',
      conditions: presetConditions(preset),
    })
    expect(diagram.warning).toBeDefined()
    expect(
      diagram.sections[0].nodes
        .filter((node) => /API/.test(node.title))
        .every((node) => node.blocked),
    ).toBe(true)
    expect(
      diagram.sections[0].nodes.filter((node) => node.tag === 'หยุดที่ขั้นนี้'),
    ).toHaveLength(1)
  })
  it('shows success when all checks pass and skips client checks in TLS', () => {
    for (const conditions of [
      validConditions,
      presetConditions('missing-key'),
    ]) {
      const diagram = buildDiagram({ ...base, chapter: 'failures', conditions })
      expect(diagram.warning).toBeUndefined()
      expect(diagram.sections[0].nodes.some((node) => node.blocked)).toBe(false)
    }
  })
  it('stops at the first applicable blocker when several conditions fail', () => {
    const diagram = buildDiagram({
      ...base,
      chapter: 'failures',
      mode: 'mTLS',
      conditions: {
        ...validConditions,
        serverTrusted: false,
        privateAvailable: false,
      },
    })
    expect(diagram.warning?.title).toBe('PKIX path building failed')
    expect(
      diagram.sections[0].nodes.find((node) => node.id === 'key-store')
        ?.blocked,
    ).toBe(true)
  })
  it('uses a local root for both chain directions independently of the explorer selection', () => {
    const server = buildDiagram({
      ...base,
      chapter: 'certificates',
      certificate: 'clientCert',
    })
    expect(server.sections[0].title).toContain('Client')
    expect(
      server.sections[1].nodes.find((node) => node.id === 'local-root')?.title,
    ).toBe('Client Trust Store')
    const client = buildDiagram({
      ...base,
      chapter: 'certificates',
      mode: 'mTLS',
      chainSide: 'OneApp → ECAS',
    })
    expect(
      client.sections[1].nodes.find((node) => node.id === 'local-root')?.title,
    ).toBe('Server Trust Store')
  })
  it('keeps storage material unlinked and adds client authentication only in mTLS architecture', () => {
    const tls = buildDiagram({ ...base, chapter: 'architecture' })
    expect(
      tls.sections.slice(0, 2).every((section) => section.linked === false),
    ).toBe(true)
    expect(
      tls.sections[2].nodes.some((node) => node.id === 'client-identity'),
    ).toBe(false)
    expect(
      nodes({ ...base, chapter: 'architecture', mode: 'mTLS' }).some(
        (node) => node.id === 'client-identity',
      ),
    ).toBe(true)
  })
  it('keeps inbound server identity separate from outbound client identity', () => {
    const inbound = nodes({
      ...base,
      chapter: 'java',
      configTab: 'Inbound HTTPS',
    })
    expect(
      inbound.find((node) => node.id === 'inbound-store')?.detail,
    ).toContain('serverAuth')
    expect(inbound.some((node) => node.id === 'http-client')).toBe(false)
    expect(
      nodes({ ...base, chapter: 'java', configTab: 'HTTP Client' }).some(
        (node) => node.title === 'ssl.fromBundle("ecas")',
      ),
    ).toBe(true)
  })
})
