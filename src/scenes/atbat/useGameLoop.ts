import { useEffect, useRef } from 'react'

/** requestAnimationFrame loop; cb receives performance.now() timestamps. */
export function useGameLoop(cb: (now: number) => void): void {
  const cbRef = useRef(cb)
  cbRef.current = cb

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      cbRef.current(now)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}
