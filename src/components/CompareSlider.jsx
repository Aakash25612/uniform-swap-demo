import { useCallback, useEffect, useRef, useState } from 'react'
import PlayerPortrait from './PlayerPortrait'

export default function CompareSlider({ beforePlayer, beforeTeam, afterPlayer, afterTeam }) {
  const trackRef = useRef(null)
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)

  const setFromClientX = useCallback((clientX) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(98, Math.max(2, next)))
  }, [])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      const x = e.touches ? e.touches[0].clientX : e.clientX
      setFromClientX(x)
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [setFromClientX])

  return (
    <div className="compare">
      <div
        className="compare-track"
        ref={trackRef}
        onPointerDown={(e) => {
          dragging.current = true
          setFromClientX(e.clientX)
        }}
      >
        <div className="compare-layer compare-after">
          <PlayerPortrait player={afterPlayer} team={afterTeam} width={340} />
          <span className="compare-tag after">After · {afterTeam.short}</span>
        </div>
        <div className="compare-layer compare-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <PlayerPortrait player={beforePlayer} team={beforeTeam} width={340} />
          <span className="compare-tag before">Before · {beforeTeam.short}</span>
        </div>
        <div className="compare-handle" style={{ left: `${pos}%` }} aria-hidden>
          <div className="compare-line" />
          <div className="compare-knob">
            <span />
            <span />
          </div>
        </div>
      </div>
      <input
        className="compare-range"
        type="range"
        min="2"
        max="98"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
      />
    </div>
  )
}
