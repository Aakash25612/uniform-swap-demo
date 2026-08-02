import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Sparkles, Wand2 } from 'lucide-react'
import { SAMPLE_PLAYERS } from '../data/players'
import { TEAMS, getTeam } from '../data/teams'
import {
  getStoredApiKey,
  requestAiKitSwap,
  setStoredApiKey,
} from '../lib/aiKitSwap'
import { runKitSwap } from '../lib/kitSwap'
import { fileToImageUrl } from '../lib/loadImageFile'
import ApiKeyPanel from './ApiKeyPanel'
import CompareSlider from './CompareSlider'
import ProcessingOverlay from './ProcessingOverlay'
import TeamPicker from './TeamPicker'
import UploadZone from './UploadZone'
import { ExportBar } from './Sections'

function useApiKey() {
  const [apiKey, setApiKeyState] = useState(() => getStoredApiKey())
  const setApiKey = (next) => {
    setStoredApiKey(next)
    setApiKeyState(next)
  }
  return [apiKey, setApiKey]
}

export default function Studio() {
  const [playerId, setPlayerId] = useState(SAMPLE_PLAYERS[0].id)
  const [fromTeamId, setFromTeamId] = useState(SAMPLE_PLAYERS[0].teamId)
  const [toTeamId, setToTeamId] = useState('bos')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [beforeUrl, setBeforeUrl] = useState(null)
  const [afterUrl, setAfterUrl] = useState(null)
  const [engine, setEngine] = useState('')
  const [resultKey, setResultKey] = useState(0)
  const [apiKey, setApiKey] = useApiKey()

  const player = useMemo(
    () => SAMPLE_PLAYERS.find((p) => p.id === playerId) ?? SAMPLE_PLAYERS[0],
    [playerId],
  )
  const fromTeam = getTeam(fromTeamId)
  const toTeam = getTeam(toTeamId)
  const hasResult = Boolean(beforeUrl && afterUrl)
  const sourcePreview = file && previewUrl ? previewUrl : player.photo

  useEffect(() => {
    let cancelled = false
    let objectUrl = null

    async function load() {
      if (!file) {
        setPreviewUrl(null)
        return
      }
      try {
        const url = await fileToImageUrl(file)
        if (cancelled) {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url)
          return
        }
        objectUrl = url.startsWith('blob:') ? url : null
        setPreviewUrl(url)
      } catch {
        if (!cancelled) {
          setError('Could not read that file. Try a PNG.')
          setFile(null)
        }
      }
    }

    load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const clearResult = () => {
    setBeforeUrl(null)
    setAfterUrl(null)
    setEngine('')
    setError('')
  }

  const selectSample = (id) => {
    const p = SAMPLE_PLAYERS.find((x) => x.id === id)
    if (!p) return
    setPlayerId(id)
    setFromTeamId(p.teamId)
    clearResult()
    setFile(null)
    if (toTeamId === p.teamId) {
      const alt = TEAMS.find((t) => t.id !== p.teamId)
      if (alt) setToTeamId(alt.id)
    }
  }

  const runSwap = useCallback(async () => {
    if (fromTeamId === toTeamId || processing) return
    setProcessing(true)
    setError('')
    clearResult()

    try {
      const sourceUrl = file && previewUrl ? previewUrl : player.photo
      if (!sourceUrl) throw new Error('No source image')

      if (apiKey) {
        const result = await requestAiKitSwap({
          sourceUrl,
          fromTeam,
          toTeam,
          apiKey,
        })
        setBeforeUrl(result.beforeUrl)
        setAfterUrl(result.afterUrl)
        setEngine(result.model ? `OpenAI · ${result.model}` : 'OpenAI image edit')
      } else {
        const result = await runKitSwap({
          sourceUrl,
          fromTeam,
          toTeam,
          autoDetect: true,
        })
        setBeforeUrl(result.beforeUrl)
        setAfterUrl(result.afterUrl)
        setEngine('Local color remap (add API key for photo-real)')
      }

      setResultKey((k) => k + 1)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Kit swap failed')
    } finally {
      setProcessing(false)
    }
  }, [apiKey, file, fromTeam, fromTeamId, player.photo, previewUrl, processing, toTeam, toTeamId])

  const exportPng = () => {
    if (!afterUrl) return
    const a = document.createElement('a')
    a.href = afterUrl
    const base = file?.name
      ? file.name.replace(/\.[^.]+$/, '')
      : player.name.replace(/\s+/g, '-').toLowerCase()
    a.download = `${base}-${toTeam.short.toLowerCase()}-swap.png`
    a.click()
  }

  return (
    <section className="section studio" id="studio">
      <div className="section-head">
        <h2>Swap studio</h2>
        <p>
          Real media-day headshots. With an OpenAI key, GPT Image edits the cap and jersey while
          locking face and body. Without a key, a basic local remap still runs.
        </p>
      </div>

      <div className="studio-layout">
        <aside className="studio-controls">
          <ApiKeyPanel apiKey={apiKey} onChange={setApiKey} />

          <div className="control-block">
            <div className="field-label">Sample headshots</div>
            <div className="sample-row sample-row-photos">
              {SAMPLE_PLAYERS.map((p) => {
                const t = getTeam(p.teamId)
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`sample-card sample-photo ${playerId === p.id && !file ? 'is-active' : ''}`}
                    onClick={() => selectSample(p.id)}
                  >
                    <img src={p.photo} alt={p.name} />
                    <span>
                      <strong>{p.name.replace('Trade ', '')}</strong>
                      <small>{t.short} · chest-up</small>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="control-block">
            <div className="field-label">Or upload your asset</div>
            <UploadZone
              file={file}
              previewUrl={previewUrl}
              onFile={(f) => {
                setFile(f)
                clearResult()
              }}
              onClear={() => {
                setFile(null)
                clearResult()
              }}
            />
          </div>

          <TeamPicker
            teams={TEAMS}
            value={fromTeamId}
            onChange={(id) => {
              setFromTeamId(id)
              clearResult()
            }}
            label="Current kit"
          />

          <TeamPicker
            teams={TEAMS}
            value={toTeamId}
            onChange={(id) => {
              setToTeamId(id)
              clearResult()
            }}
            label="Trade destination"
            excludeId={fromTeamId}
          />

          {error ? <p className="studio-error">{error}</p> : null}

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={processing || fromTeamId === toTeamId}
            onClick={runSwap}
          >
            {processing ? (
              <>
                <RefreshCw size={16} className="spin" />{' '}
                {apiKey ? 'Generating with AI…' : 'Processing…'}
              </>
            ) : (
              <>
                {apiKey ? <Wand2 size={16} /> : <Sparkles size={16} />}
                {apiKey ? 'Generate AI kit swap' : 'Generate local remap'}
              </>
            )}
          </button>
        </aside>

        <div className="studio-stage">
          <ProcessingOverlay active={processing} ai={Boolean(apiKey)} />

          {!hasResult ? (
            <div className="stage-preview stage-preview-photo">
              <div className="stage-frame photo-frame">
                <img src={sourcePreview} alt="Source headshot" />
                <span className="compare-tag before">Source · {fromTeam.short}</span>
              </div>
              <div className="stage-hint">
                <p>
                  Destination kit: <strong>{toTeam.name}</strong>
                </p>
                <div
                  className="dest-swatch"
                  style={{ '--c1': toTeam.primary, '--c2': toTeam.hat }}
                >
                  <span className="dest-hat">{toTeam.logoLetter}</span>
                  <small>{toTeam.short} cap + jersey</small>
                </div>
                <p className="engine-note">
                  {apiKey
                    ? 'AI mode will keep face & body, replace cap + jersey only.'
                    : 'Add an OpenAI key above for photo-real results like the source shots.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="stage-result" key={resultKey}>
              <CompareSlider
                beforeUrl={beforeUrl}
                afterUrl={afterUrl}
                beforeLabel={`Before · ${fromTeam.short}`}
                afterLabel={`After · ${toTeam.short}`}
              />
              {engine ? <p className="engine-badge">{engine}</p> : null}
              <ExportBar
                playerName={file?.name ? file.name.replace(/\.[^.]+$/, '') : player.name}
                teamName={toTeam.name}
                onExport={exportPng}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
