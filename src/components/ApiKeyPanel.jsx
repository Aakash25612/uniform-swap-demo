import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

export default function ApiKeyPanel({ apiKey, onChange }) {
  const [draft, setDraft] = useState(apiKey || '')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(Boolean(apiKey))

  useEffect(() => {
    setDraft(apiKey || '')
    setSaved(Boolean(apiKey))
  }, [apiKey])

  const save = () => {
    const next = draft.trim()
    onChange(next)
    setSaved(Boolean(next))
  }

  const clear = () => {
    setDraft('')
    onChange('')
    setSaved(false)
  }

  return (
    <div className="api-panel">
      <div className="field-label">
        <KeyRound size={12} /> OpenAI API key
      </div>
      <p className="api-hint">
        Paste your key here (kept in this browser session only). Powers photo-real kit swaps via
        GPT Image. Leave empty for the basic local remap.
      </p>
      <div className="api-row">
        <input
          type={show ? 'text' : 'password'}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setSaved(false)
          }}
          placeholder="sk-..."
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          onClick={() => setShow((s) => !s)}
          aria-label="Toggle key visibility"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div className="api-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!draft.trim()}>
          {saved ? 'Saved' : 'Save key'}
        </button>
        {apiKey ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
            Clear
          </button>
        ) : null}
        <span className={`api-status ${apiKey ? 'is-on' : ''}`}>
          {apiKey ? 'AI swap ready' : 'Local remap only'}
        </span>
      </div>
    </div>
  )
}
