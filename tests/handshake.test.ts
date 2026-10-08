import { describe, expect, it } from 'vitest'
import {
  buildSteps,
  getFailure,
  initialPlayback,
  movePlayback,
  presetConditions,
  presets,
  STEP_DURATION,
  tickPlayback,
  validConditions,
  type Playback,
} from '../src/lib/handshake'
import { certificates, concepts, type Level, type Mode, type Protocol } from '../src/data/lessons'
const variants = (['TLS', 'mTLS'] as Mode[]).flatMap((mode) =>
  (['Beginner', 'Advanced'] as Level[]).flatMap((level) =>
    (['1.2', '1.3'] as Protocol[]).map((protocol) => ({ mode, level, protocol })),
  ),
)
describe.each(variants)('$mode / $level / TLS $protocol', ({ mode, level, protocol }) => {
  const steps = buildSteps(mode, level, protocol)
  it('opens the application tunnel only after authentication and before the request', () => {
    const secure = steps.findIndex((s) => s.phase === 'secure'),
      request = steps.findIndex((s) => s.phase === 'request')
    expect(secure).toBeGreaterThan(steps.findIndex((s) => s.phase === 'serverValidate'))
    expect(request).toBeGreaterThan(secure)
    expect(steps.some((s) => s.phase === 'clientCert')).toBe(mode === 'mTLS')
    if (mode === 'mTLS')
      expect(secure).toBeGreaterThan(steps.findIndex((s) => s.phase === 'clientValidate'))
    expect(
      steps.filter((s) => s.direction).some((s) => /private.?key/i.test(s.artifact ?? '')),
    ).toBe(false)
  })
  it('valid conditions reach completion', () => {
    let state: Playback = { ...initialPlayback, status: 'running' }
    for (let i = 0; i < steps.length; i++) state = tickPlayback(state, STEP_DURATION, steps)
    expect(state.status).toBe('complete')
    expect(state.index).toBe(steps.length - 1)
    expect(getFailure(steps, validConditions)).toBeUndefined()
  })
  for (const preset of presets.filter((p) => p.field))
    it(`${preset.id}: fails before API or skips client checks in TLS`, () => {
      const conditions = presetConditions(preset.id),
        failure = getFailure(steps, conditions)
      if (preset.client && mode === 'TLS') {
        expect(failure).toBeUndefined()
        return
      }
      expect(failure?.field).toBe(preset.field)
      expect(failure?.index).toBeLessThan(steps.findIndex((s) => s.phase === 'secure'))
      let state: Playback = { ...initialPlayback, status: 'running' }
      for (let i = 0; i < steps.length + 2; i++)
        state = tickPlayback(state, STEP_DURATION, steps, failure)
      expect(state.status).toBe('failed')
      expect(state.index).toBe(failure?.index)
      expect(movePlayback(steps.length - 1, steps, failure).index).toBe(failure?.index)
    })
})
describe('protocol truth and fixtures', () => {
  it('keeps Beginner at the requested 10 / 14 conceptual steps', () => {
    expect(buildSteps('TLS', 'Beginner', '1.3')).toHaveLength(10)
    expect(buildSteps('mTLS', 'Beginner', '1.3')).toHaveLength(14)
  })
  it('TLS 1.3 requests client identity before the server certificate and derives handshake keys early', () => {
    const steps = buildSteps('mTLS', 'Advanced', '1.3')
    expect(steps.findIndex((s) => s.phase === 'requestCert')).toBeLessThan(
      steps.findIndex((s) => s.phase === 'serverCert'),
    )
    expect(steps.findIndex((s) => s.id === 'handshake-keys')).toBeLessThan(
      steps.findIndex((s) => s.phase === 'serverCert'),
    )
    expect(steps.some((s) => s.artifact === 'ChangeCipherSpec')).toBe(false)
  })
  it('TLS 1.2 ECDHE uses ServerKeyExchange and ChangeCipherSpec with correct Finished ordering', () => {
    const ids = buildSteps('mTLS', 'Advanced', '1.2').map((s) => s.id)
    expect(ids.indexOf('server-key-exchange')).toBeLessThan(ids.indexOf('server-hello-done'))
    expect(ids.indexOf('client-proof')).toBeLessThan(ids.indexOf('client-ccs'))
    expect(ids.indexOf('client-finished')).toBeLessThan(ids.indexOf('server-finished'))
    expect(ids.indexOf('server-finished')).toBeLessThan(ids.indexOf('secure'))
  })
  it('issuer names match the issuing CA and server/client EKUs differ', () => {
    expect(certificates.serverCert.Issuer).toBe(concepts.serverCA.title)
    expect(certificates.clientCert.Issuer).toBe(concepts.clientCA.title)
    expect(certificates.serverCert['Extended Key Usage']).toContain('serverAuth')
    expect(certificates.clientCert['Extended Key Usage']).toContain('clientAuth')
  })
  it('selecting another preset removes old blockers', () => {
    const first = presetConditions('expired')
    const next = presetConditions('missing-key')
    expect(first.notExpired).toBe(false)
    expect(next.notExpired).toBe(true)
    expect(next.privateAvailable).toBe(false)
    expect(presetConditions('valid')).toEqual(validConditions)
  })
  it('multiple errors stop at the earliest blocker and server checks precede client checks', () => {
    const steps = buildSteps('mTLS', 'Advanced', '1.3')
    const failure = getFailure(steps, {
      ...validConditions,
      serverTrusted: false,
      privateAvailable: false,
      clientTrusted: false,
    })
    expect(failure?.field).toBe('serverTrusted')
    expect(
      getFailure(steps, { ...validConditions, clientAvailable: false, keyMatches: false })?.field,
    ).toBe('clientAvailable')
  })
  it('paused clocks do not change state and manual backtracking leaves failure', () => {
    const steps = buildSteps('mTLS', 'Beginner', '1.3')
    const failure = getFailure(steps, presetConditions('expired'))!
    const failed = movePlayback(99, steps, failure)
    const back = movePlayback(failed.index - 1, steps, failure)
    expect(back.status).toBe('paused')
    expect(tickPlayback(back, 100000, steps, failure)).toBe(back)
    expect(movePlayback(-1, steps).index).toBe(0)
  })
})
