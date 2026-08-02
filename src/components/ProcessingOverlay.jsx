import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const STEPS = [
  'Detecting body composition',
  'Segmenting uniform & hat',
  'Matching pose landmarks',
  'Applying target kit',
  'Refining edges & lighting',
]

export default function ProcessingOverlay({ active, ai = false }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!active) {
      setStep(0)
      return undefined
    }

    setStep(0)
    const intervalMs = ai ? 900 : 450
    const timers = STEPS.map((_, i) =>
      window.setTimeout(() => setStep(Math.min(i + 1, STEPS.length)), (i + 1) * intervalMs),
    )
    return () => timers.forEach(clearTimeout)
  }, [active, ai])

  if (!active) return null

  return (
    <div className="processing" role="status" aria-live="polite">
      <div className="processing-card">
        <div className="processing-orb" aria-hidden />
        <h3>{ai ? 'AI kit swap' : 'Running kit swap'}</h3>
        <p>
          {ai
            ? 'GPT Image · preserving face & body · cap + jersey only'
            : 'Client-side remap · preserving body composition'}
        </p>
        <ul className="processing-steps">
          {STEPS.map((label, i) => {
            const done = step > i
            const current = step === i
            return (
              <li key={label} className={done ? 'is-done' : current ? 'is-current' : ''}>
                <span className="step-icon">
                  {done ? <Check size={14} /> : current ? <Loader2 size={14} className="spin" /> : null}
                </span>
                {label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
