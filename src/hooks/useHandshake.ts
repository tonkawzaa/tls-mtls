import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getFailure,
  initialPlayback,
  movePlayback,
  tickPlayback,
  type Conditions,
  type Playback,
  type Step,
} from '../lib/handshake'
export function useHandshake(steps: Step[], conditions: Conditions) {
  const [state, setState] = useState<Playback>(initialPlayback)
  const failure = useMemo(() => getFailure(steps, conditions), [steps, conditions])
  useEffect(() => {
    if (state.status !== 'running') return
    let last = Date.now()
    const timer = window.setInterval(() => {
      const now = Date.now()
      const delta = now - last
      last = now
      setState((s) => tickPlayback(s, delta, steps, failure))
    }, 50)
    return () => window.clearInterval(timer)
  }, [state.status, steps, failure])
  const reset = useCallback(() => setState({ ...initialPlayback }), [])
  const pause = useCallback(
    () => setState((s) => (s.status === 'running' ? { ...s, status: 'paused' } : s)),
    [],
  )
  const start = useCallback(() => setState({ ...initialPlayback, status: 'running' }), [])
  const play = () =>
    setState((s) =>
      s.status === 'failed' || s.status === 'complete'
        ? { ...initialPlayback, status: 'running' }
        : { ...s, status: 'running' },
    )
  const move = (delta: number) => setState((s) => movePlayback(s.index + delta, steps, failure))
  return {
    state,
    steps,
    current: steps[state.index] ?? steps[0],
    failure: state.status === 'failed' ? failure : undefined,
    reset,
    pause,
    start,
    play,
    previous: () => move(-1),
    next: () => move(1),
  }
}
export type HandshakeController = ReturnType<typeof useHandshake>
