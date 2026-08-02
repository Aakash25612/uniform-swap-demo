import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'

const ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp,.tif,.tiff'

export default function PhotoSlot({
  label,
  hint,
  previewUrl,
  onFile,
  onClear,
  samples,
  onSample,
}) {
  const inputRef = useRef(null)
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const take = useCallback(
    (list) => {
      const f = list?.[0]
      if (!f) return
      onFile(f)
    },
    [onFile],
  )

  return (
    <div className="photo-slot">
      <div className="photo-slot-head">
        <h2>{label}</h2>
        <p>{hint}</p>
      </div>

      {previewUrl ? (
        <div className="photo-preview">
          <img src={previewUrl} alt={label} />
          <button type="button" className="photo-clear" onClick={onClear} aria-label="Remove">
            <X size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`photo-drop ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            take(e.dataTransfer.files)
          }}
        >
          <ImagePlus size={22} strokeWidth={1.5} />
          <span>Drop a photo or browse</span>
          <small>PNG, JPG, or WEBP</small>
        </label>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => take(e.target.files)}
      />

      {samples?.length ? (
        <div className="sample-strip">
          <span>Try a sample</span>
          <div className="sample-thumbs">
            {samples.map((s) => (
              <button
                key={s.id}
                type="button"
                className="sample-thumb"
                onClick={() => onSample?.(s)}
                title={s.name}
              >
                <img src={s.photo} alt={s.name} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function useObjectUrl(file) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return undefined
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])

  return url
}

export function ResultCompare({ beforeUrl, afterUrl }) {
  const trackRef = useRef(null)
  const [pos, setPos] = useState(50)
  const dragging = useRef(false)

  const setFromX = useCallback((clientX) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos(Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  useEffect(() => {
    const move = (e) => {
      if (!dragging.current) return
      setFromX(e.touches ? e.touches[0].clientX : e.clientX)
    }
    const up = () => {
      dragging.current = false
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [setFromX])

  return (
    <div className="result">
      <div
        className="result-track"
        ref={trackRef}
        onPointerDown={(e) => {
          dragging.current = true
          setFromX(e.clientX)
        }}
      >
        <img className="layer after" src={afterUrl} alt="After kit swap" draggable={false} />
        <div className="layer before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={beforeUrl} alt="Before" draggable={false} />
        </div>
        <div className="result-handle" style={{ left: `${pos}%` }} aria-hidden />
        <span className="result-tag left">Before</span>
        <span className="result-tag right">After</span>
      </div>
      <input
        className="result-range"
        type="range"
        min="4"
        max="96"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
      />
    </div>
  )
}

export function WorkingOverlay({ active }) {
  if (!active) return null
  return (
    <div className="working" role="status" aria-live="polite">
      <div className="working-card">
        <Loader2 className="spin" size={22} />
        <p>Creating kit swap…</p>
        <small>Keeping the player. Copying the kit.</small>
      </div>
    </div>
  )
}
