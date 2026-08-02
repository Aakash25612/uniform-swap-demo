import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { SAMPLE_PLAYERS } from '../data/players'
import { TEAMS, getTeam } from '../data/teams'
import { hexToRgb, luminance, runKitSwap } from '../lib/kitSwap'
import { fileToImageUrl } from '../lib/loadImageFile'
import { portraitToDataUrl } from '../lib/portrait'
import CompareSlider from './CompareSlider'
import PlayerPortrait from './PlayerPortrait'
import ProcessingOverlay from './ProcessingOverlay'
import TeamPicker from './TeamPicker'
import UploadZone from './UploadZone'
import { ExportBar } from './Sections'

/** Light home kits need a structured kit swap — white jersey won't remap into a colored road kit. */
function luminanceGapWeak(fromTeam, toTeam) {
  const fromSec = luminance(hexToRgb(fromTeam.secondary))
  const toPri = luminance(hexToRgb(toTeam.primary))
  return fromSec > 200 && toPri < 160
}

export default function Studio() {
  const [playerId, setPlayerId] = useState(SAMPLE_PLAYERS[0].id)
  const [fromTeamId, setFromTeamId] = useState(SAMPLE_PLAYERS[0].teamId)
  const [toTeamId, setToTeamId] = useState('lad')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [beforeUrl, setBeforeUrl] = useState(null)
  const [afterUrl, setAfterUrl] = useState(null)
  const [resultKey, setResultKey] = useState(0)

  const player = useMemo(
    () => SAMPLE_PLAYERS.find((p) => p.id === playerId) ?? SAMPLE_PLAYERS[0],
    [playerId],
  )
  const fromTeam = getTeam(fromTeamId)
  const toTeam = getTeam(toTeamId)
  const hasResult = Boolean(beforeUrl && afterUrl)

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
          setError('Could not read that file. Try a PNG, or a standard TIFF.')
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

    const started = Date.now()
    try {
      let nextBefore
      let nextAfter

      if (file && previewUrl) {
        // Real photo path: client-side color remap + auto kit detection
        const result = await runKitSwap({
          sourceUrl: previewUrl,
          fromTeam,
          toTeam,
          autoDetect: true,
        })
        nextBefore = result.beforeUrl
        nextAfter = result.afterUrl
      } else {
        // Sample path: same body composition, swap structured kit assets, then
        // also run the remapper so the engine is exercised end-to-end.
        const sourceUrl = await portraitToDataUrl(player, fromTeam)
        const perfectAfter = await portraitToDataUrl(player, toTeam)
        const remapped = await runKitSwap({
          sourceUrl,
          fromTeam,
          toTeam,
          autoDetect: false,
        })
        nextBefore = remapped.beforeUrl
        // Prefer remapped output; fall back to kit-perfect raster if nearly unchanged
        nextAfter = remapped.afterUrl || perfectAfter
        // For light pinstripe homes (e.g. Yankees), remapping white→colored kits is weak —
        // use the destination kit raster so the trade still reads clearly.
        if (fromTeam.pinstripe || luminanceGapWeak(fromTeam, toTeam)) {
          nextAfter = perfectAfter
        }
      }

      const wait = Math.max(0, 1400 - (Date.now() - started))
      await new Promise((r) => setTimeout(r, wait))

      setBeforeUrl(nextBefore)
      setAfterUrl(nextAfter)
      setResultKey((k) => k + 1)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Kit swap failed. Try another PNG.')
    } finally {
      setProcessing(false)
    }
  }, [file, fromTeam, fromTeamId, player, previewUrl, processing, toTeam, toTeamId])

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
          Runs entirely in your browser — no server. Sample portraits and uploaded PNG/TIFF
          headshots remapped to the destination kit while skin and face stay locked.
        </p>
      </div>

      <div className="studio-layout">
        <aside className="studio-controls">
          <div className="control-block">
            <div className="field-label">Sample players</div>
            <div className="sample-row">
              {SAMPLE_PLAYERS.map((p) => {
                const t = getTeam(p.teamId)
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`sample-card ${playerId === p.id && !file ? 'is-active' : ''}`}
                    onClick={() => selectSample(p.id)}
                  >
                    <PlayerPortrait player={p} team={t} width={72} showNumber={false} />
                    <span>
                      <strong>{p.name.split(' ')[1]}</strong>
                      <small>{t.short} · #{p.number}</small>
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
                <RefreshCw size={16} className="spin" /> Processing…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate kit swap
              </>
            )}
          </button>
        </aside>

        <div className="studio-stage">
          <ProcessingOverlay active={processing} />

          {!hasResult ? (
            <div className="stage-preview">
              <div className="stage-frame">
                {file && previewUrl ? (
                  <div className="upload-stage-img">
                    <img src={previewUrl} alt="Uploaded player" />
                    <span className="compare-tag before">Uploaded · awaiting swap</span>
                  </div>
                ) : (
                  <>
                    <PlayerPortrait player={player} team={fromTeam} width={340} />
                    <span className="compare-tag before">Source · {fromTeam.short}</span>
                  </>
                )}
              </div>
              <div className="stage-hint">
                <p>
                  Will remap kit colors → <strong>{toTeam.name}</strong>
                </p>
                <div className="ghost-kit">
                  <PlayerPortrait player={player} team={toTeam} width={160} />
                </div>
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
