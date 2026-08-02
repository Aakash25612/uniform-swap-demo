import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import { SAMPLE_PLAYERS } from '../data/players'
import { TEAMS, getTeam } from '../data/teams'
import CompareSlider from './CompareSlider'
import PlayerPortrait from './PlayerPortrait'
import ProcessingOverlay from './ProcessingOverlay'
import TeamPicker from './TeamPicker'
import UploadZone from './UploadZone'
import { ExportBar } from './Sections'

export default function Studio() {
  const [playerId, setPlayerId] = useState(SAMPLE_PLAYERS[0].id)
  const [fromTeamId, setFromTeamId] = useState(SAMPLE_PLAYERS[0].teamId)
  const [toTeamId, setToTeamId] = useState('lad')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [resultKey, setResultKey] = useState(0)

  const player = useMemo(
    () => SAMPLE_PLAYERS.find((p) => p.id === playerId) ?? SAMPLE_PLAYERS[0],
    [playerId],
  )
  const fromTeam = getTeam(fromTeamId)
  const toTeam = getTeam(toTeamId)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const selectSample = (id) => {
    const p = SAMPLE_PLAYERS.find((x) => x.id === id)
    if (!p) return
    setPlayerId(id)
    setFromTeamId(p.teamId)
    setHasResult(false)
    setFile(null)
    if (toTeamId === p.teamId) {
      const alt = TEAMS.find((t) => t.id !== p.teamId)
      if (alt) setToTeamId(alt.id)
    }
  }

  const runSwap = () => {
    if (fromTeamId === toTeamId) return
    setProcessing(true)
    setHasResult(false)
  }

  const onProcessed = useCallback(() => {
    setProcessing(false)
    setHasResult(true)
    setResultKey((k) => k + 1)
  }, [])

  const exportPng = () => {
    const svg = document.querySelector('.result-export svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const source = serializer.serializeToString(svg)
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 800
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0b1018'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((png) => {
        if (!png) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(png)
        a.download = `${player.name.replace(/\s+/g, '-').toLowerCase()}-${toTeam.short.toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(a.href)
      }, 'image/png')
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <section className="section studio" id="studio">
      <div className="section-head">
        <h2>Swap studio</h2>
        <p>
          Pick a sample headshot or upload a PNG/TIFF, choose the destination kit, then run the
          demo swap. Body composition stays locked — only uniform and hat change.
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
                setHasResult(false)
              }}
              onClear={() => {
                setFile(null)
                setHasResult(false)
              }}
            />
          </div>

          <TeamPicker
            teams={TEAMS}
            value={fromTeamId}
            onChange={(id) => {
              setFromTeamId(id)
              setHasResult(false)
            }}
            label="Current kit"
            excludeId={null}
          />

          <TeamPicker
            teams={TEAMS}
            value={toTeamId}
            onChange={(id) => {
              setToTeamId(id)
              setHasResult(false)
            }}
            label="Trade destination"
            excludeId={fromTeamId}
          />

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
          <ProcessingOverlay active={processing} onDone={onProcessed} />

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
                  Destination preview: <strong>{toTeam.name}</strong>
                </p>
                <div className="ghost-kit">
                  <PlayerPortrait
                    player={{ ...player, number: player.number }}
                    team={toTeam}
                    width={160}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="stage-result" key={resultKey}>
              <CompareSlider
                beforePlayer={player}
                beforeTeam={fromTeam}
                afterPlayer={player}
                afterTeam={toTeam}
              />
              <div className="result-export" hidden aria-hidden>
                <PlayerPortrait player={player} team={toTeam} width={640} />
              </div>
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
