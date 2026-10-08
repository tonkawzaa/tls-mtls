import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHandshake } from '../src/hooks/useHandshake'
import {
  buildSteps,
  presetConditions,
  STEP_DURATION,
  validConditions,
} from '../src/lib/handshake'
import App from '../src/App'
import { StrictMode } from 'react'
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
  window.scrollTo = vi.fn()
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    if (this.open) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
  window.location.hash = ''
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
describe('playback clock', () => {
  it('pauses in-flight progress and resumes the same fraction', () => {
    const steps = buildSteps('TLS', 'Beginner', '1.3')
    const { result } = renderHook(() => useHandshake(steps, validConditions))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(1000))
    act(() => result.current.pause())
    const paused = result.current.state
    act(() => vi.advanceTimersByTime(10000))
    expect(result.current.state).toEqual(paused)
    act(() => result.current.play())
    act(() => vi.advanceTimersByTime(1500))
    expect(result.current.state.index).toBe(1)
    expect(result.current.state.elapsed).toBe(0)
  })
  it('reset cancels old ticks, and unmount leaves no timers', () => {
    const steps = buildSteps('mTLS', 'Advanced', '1.3')
    const { result, unmount } = renderHook(() =>
      useHandshake(steps, validConditions),
    )
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(500))
    act(() => result.current.reset())
    act(() => vi.advanceTimersByTime(90000))
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.index).toBe(0)
    act(() => result.current.start())
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('manual Next pauses playback; failing checks block Next and API', () => {
    const steps = buildSteps('mTLS', 'Beginner', '1.3')
    const { result } = renderHook(() =>
      useHandshake(steps, presetConditions('missing-key')),
    )
    act(() => result.current.start())
    act(() => result.current.next())
    expect(result.current.state.status).toBe('paused')
    act(() => result.current.play())
    act(() => vi.advanceTimersByTime(60000))
    expect(result.current.state.status).toBe('failed')
    const index = result.current.state.index
    act(() => result.current.next())
    expect(result.current.state.index).toBe(index)
    act(() => result.current.previous())
    expect(result.current.failure).toBeUndefined()
  })
})
describe('workspace interactions', () => {
  it('mode changes reset the clock and replace TLS steps with mTLS; navigation pauses playback', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Connect to Server' }))
    act(() => vi.advanceTimersByTime(STEP_DURATION * 3))
    const modes = screen.getByRole('group', { name: 'Authentication mode' })
    fireEvent.click(within(modes).getByRole('button', { name: 'mTLS' }))
    expect(screen.getByText('1 / 14')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Connect to Server' }))
    fireEvent.click(screen.getByRole('link', { name: 'Certificates & CA' }))
    act(() => vi.advanceTimersByTime(50000))
    fireEvent.click(screen.getByRole('link', { name: 'Handshake' }))
    expect(screen.getByText('1 / 14')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()
  })
  it('client error presets switch to mTLS and a valid preset clears their conditions', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Failure Lab' }))
    fireEvent.click(screen.getByRole('button', { name: /Missing Key/ }))
    expect(
      (
        screen.getByRole('switch', {
          name: 'Client Private Key',
        }) as HTMLInputElement
      ).checked,
    ).toBe(false)
    expect(
      within(screen.getByRole('group', { name: 'Authentication mode' }))
        .getByRole('button', { name: 'mTLS' })
        .getAttribute('aria-pressed'),
    ).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Start Handshake' }))
    act(() => vi.advanceTimersByTime(50000))
    expect(
      screen.getByRole('heading', {
        name: 'Cannot prove certificate ownership',
      }),
    ).toBeDefined()
    expect(
      screen.getByText(/API ยังไม่ถูกส่ง · Secure Connection/),
    ).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Valid' }))
    expect(
      (
        screen.getByRole('switch', {
          name: 'Client Private Key',
        }) as HTMLInputElement
      ).checked,
    ).toBe(true)
  })
  it('certificate fields change explanations and the private key opens its inspector', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Certificates & CA' }))
    fireEvent.click(screen.getByRole('button', { name: /^Issuer Company/ }))
    expect(
      screen.getByText(/ต้องตรวจลายมือชื่อและ chain ต่อไปถึง trust anchor/),
    ).toBeDefined()
    fireEvent.click(
      screen.getByRole('button', {
        name: /Client Private Key Private Key อยู่ใน Client/,
      }),
    )
    const dialog = screen.getByRole('dialog') as HTMLDialogElement
    expect(dialog.open).toBe(true)
    expect(
      within(screen.getByRole('dialog')).getByText(
        /ไม่ส่ง · ไม่แชร์ · ไม่ commit ลง Git/,
      ),
    ).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Close inspector' }))
    expect(dialog.open).toBe(false)
  })
})

describe('diagram popups', () => {
  const open = () =>
    fireEvent.click(screen.getByRole('button', { name: 'ดูแผนภาพการทำงาน' }))
  const close = () =>
    fireEvent.click(screen.getByRole('button', { name: 'ปิดแผนภาพ' }))
  it.each([
    'Handshake',
    'Certificates & CA',
    'Stores & Architecture',
    'Java Configuration',
    'Failure Lab',
  ])(
    'opens an accessible diagram for %s and restores focus on close',
    (chapter) => {
      render(<App />)
      fireEvent.click(screen.getByRole('link', { name: chapter }))
      const trigger = screen.getByRole('button', { name: 'ดูแผนภาพการทำงาน' })
      open()
      expect(
        screen.getByRole('dialog').getAttribute('aria-describedby'),
      ).toBeTruthy()
      expect(
        within(screen.getByRole('dialog')).getAllByRole('img').length,
      ).toBeGreaterThan(0)
      expect(document.body.style.overflow).toBe('hidden')
      close()
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(trigger)
      expect(document.body.style.overflow).toBe('')
      open()
      expect(screen.getByRole('dialog')).toBeDefined()
    },
  )
  it.each(['SSL Bundle', 'HTTP Client', 'JVM Options', 'Inbound HTTPS'])(
    'uses the selected Java tab: %s',
    (tab) => {
      render(<App />)
      fireEvent.click(screen.getByRole('link', { name: 'Java Configuration' }))
      fireEvent.click(
        within(
          screen.getByRole('group', { name: 'Configuration tabs' }),
        ).getByRole('button', { name: tab }),
      )
      open()
      expect(
        screen.getByRole('dialog', { name: `Java Configuration · ${tab}` }),
      ).toBeDefined()
      close()
      expect(
        within(screen.getByRole('group', { name: 'Configuration tabs' }))
          .getByRole('button', { name: tab })
          .getAttribute('aria-pressed'),
      ).toBe('true')
    },
  )
  it('keeps certificate selection independent of chain direction', () => {
    render(<App />)
    fireEvent.click(
      within(
        screen.getByRole('group', { name: 'Authentication mode' }),
      ).getByRole('button', { name: 'mTLS' }),
    )
    fireEvent.click(screen.getByRole('link', { name: 'Certificates & CA' }))
    fireEvent.click(
      within(
        screen.getByRole('group', { name: 'Certificate selection' }),
      ).getByRole('button', { name: 'oneapp-client.crt' }),
    )
    open()
    const dialog = within(screen.getByRole('dialog'))
    expect(
      dialog.getByRole('heading', { name: 'Certificate ที่เลือก · Client' }),
    ).toBeDefined()
    expect(
      dialog.getByRole('heading', { name: 'Chain validation · Server → Client' }),
    ).toBeDefined()
    close()
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Chain direction' })).getByRole(
        'button',
        { name: 'Client → Server' },
      ),
    )
    open()
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', {
        name: 'Chain validation · Client → Server',
      }),
    ).toBeDefined()
  })
  it('pauses the handshake in place and keeps it paused until Play', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Connect to Server' }))
    act(() => vi.advanceTimersByTime(STEP_DURATION + 1000))
    expect(screen.getByText('2 / 10')).toBeDefined()
    open()
    act(() => vi.advanceTimersByTime(20000))
    close()
    act(() => vi.advanceTimersByTime(20000))
    expect(screen.getByText('2 / 10')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => vi.advanceTimersByTime(1500))
    expect(screen.getByText('3 / 10')).toBeDefined()
  })
  it('pauses failure playback and predicts blockers before Start', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Failure Lab' }))
    fireEvent.click(screen.getByRole('button', { name: 'Untrusted CA' }))
    open()
    expect(
      within(screen.getByRole('dialog')).getByText('PKIX path building failed'),
    ).toBeDefined()
    close()
    fireEvent.click(screen.getByRole('button', { name: 'Start Handshake' }))
    act(() => vi.advanceTimersByTime(STEP_DURATION))
    open()
    act(() => vi.advanceTimersByTime(50000))
    close()
    expect(screen.getByText('2 / 10')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined()
  })
  it('pauses chain validation and resumes at the held stage', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Certificates & CA' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play validation' }))
    act(() => vi.advanceTimersByTime(900))
    act(() => vi.advanceTimersByTime(900))
    const held = document.querySelectorAll('.chain-checked').length
    expect(held).toBe(2)
    open()
    act(() => vi.advanceTimersByTime(10000))
    close()
    act(() => vi.advanceTimersByTime(10000))
    expect(document.querySelectorAll('.chain-checked').length).toBe(held)
    fireEvent.click(screen.getByRole('button', { name: 'Play validation' }))
    act(() => vi.advanceTimersByTime(900))
    expect(document.querySelectorAll('.chain-checked').length).toBe(held + 1)
    fireEvent.click(
      screen.getByRole('button', { name: 'Reset chain validation' }),
    )
    expect(document.querySelectorAll('.chain-checked').length).toBe(0)
  })
  it('handles Escape cancellation, background clicks, and external hash navigation', () => {
    render(<App />)
    open()
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    open()
    fireEvent.click(screen.getByRole('dialog'))
    expect(screen.queryByRole('dialog')).toBeNull()
    open()
    act(() => {
      window.location.hash = 'java'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Spring Boot / Java' }),
    ).toBeDefined()
  })
  it('stays open in React StrictMode and restores scroll on unmount', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    open()
    expect(screen.getByRole('dialog')).toBeDefined()
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })
  it('resets lifted subtab selections when leaving a chapter', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Java Configuration' }))
    fireEvent.click(screen.getByRole('button', { name: 'Inbound HTTPS' }))
    fireEvent.click(screen.getByRole('link', { name: 'Handshake' }))
    fireEvent.click(screen.getByRole('link', { name: 'Java Configuration' }))
    open()
    expect(
      screen.getByRole('dialog', { name: 'Java Configuration · SSL Bundle' }),
    ).toBeDefined()
  })
})
